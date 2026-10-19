import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ── helpers ─────────────────────────────────── */
const fmt = (s) => String(Math.max(0, s)).padStart(2, '0');
const fmtTimer = (s) => `0:${fmt(s)}`;

/* ── EmailStep ───────────────────────────────── */
function EmailStep({ onSuccess }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.requestOtp(email.trim().toLowerCase());
      onSuccess({ email: email.trim().toLowerCase(), resendAfter: data.resendAfter ?? 60 });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-enter">
      {/* Step header */}
      <div className="step-header">
        <div className="step-icon">✉️</div>
        <h1 className="step-title">Sign in to OTPost</h1>
        <p className="step-subtitle">Enter your email and we'll send you a one-time code — no password needed.</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-banner-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <input
            id="email"
            className={`form-input ${error ? 'error' : ''}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            disabled={loading}
            required
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          id="request-otp-btn"
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <><div className="spinner" /> Sending code…</>
          ) : (
            <>Send verification code →</>
          )}
        </button>
      </form>

      <div className="security-row">
        <span>🔒</span>
        <span>Secured with HMAC-SHA256 · HttpOnly cookies</span>
      </div>
    </div>
  );
}

/* ── OTP Box sub-component ───────────────────── */
function OtpInput({ value, onChange, onKeyDown, inputRef, filled, hasError }) {
  return (
    <input
      ref={inputRef}
      className={`otp-box ${filled ? 'filled' : ''} ${hasError ? 'error' : ''}`}
      type="text"
      inputMode="numeric"
      pattern="\d*"
      maxLength={1}
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}

/* ── OtpStep ─────────────────────────────────── */
function OtpStep({ email, resendAfter, onBack }) {
  const { login } = useAuth();
  const [digits,  setDigits]  = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [timer,   setTimer]   = useState(resendAfter);
  const [resending, setResending] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Focus first box on mount
  useEffect(() => { refs[0].current?.focus(); }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const otp = digits.join('');
  const allFilled = otp.length === 6 && digits.every(d => d !== '');

  // Auto-submit when all 6 boxes filled
  useEffect(() => {
    if (allFilled) handleVerify();
  }, [allFilled, otp]);

  const handleChange = (idx, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError('');
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        refs[idx - 1].current?.focus();
        const next = [...digits]; next[idx - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs[idx - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs[idx + 1].current?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  const handleVerify = useCallback(async () => {
    const code = digits.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.verifyOtp(email, code);
      setSuccess('Verified! Signing you in…');
      setTimeout(() => login(data.user), 600);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [digits, email, login]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const data = await api.requestOtp(email);
      setTimer(data.resendAfter ?? 60);
      setSuccess('A new code has been sent!');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => { setSuccess(''); refs[0].current?.focus(); }, 2500);
    } catch (err) {
      if (err.code === 'COOLDOWN') {
        const wait = Number(err.retryAfter) || 60;
        setTimer(wait);
        setError(`Please wait ${wait}s before requesting another code.`);
      } else {
        setError(err.message || 'Could not resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="step-enter">
      <button className="back-btn" onClick={onBack} id="back-btn">
        ← Back
      </button>

      <div className="step-header">
        <div className="step-icon">🔑</div>
        <h1 className="step-title">Check your inbox</h1>
        <p className="step-subtitle">
          We sent a 6-digit code to{' '}
          <span className="step-email-highlight">{email}</span>
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-banner-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner">
          <span className="error-banner-icon">✅</span>
          {success}
        </div>
      )}

      {/* 6 OTP boxes */}
      <div className="otp-group" onPaste={handlePaste} id="otp-group">
        {digits.map((d, i) => (
          <OtpInput
            key={i}
            value={d}
            filled={!!d}
            hasError={!!error}
            inputRef={refs[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>

      <button
        className="btn btn-primary"
        id="verify-otp-btn"
        onClick={handleVerify}
        disabled={loading || !allFilled}
      >
        {loading ? (
          <><div className="spinner" /> Verifying…</>
        ) : (
          <>Verify code →</>
        )}
      </button>

      {/* Resend */}
      <div className="resend-row">
        <span>Didn't get it?</span>
        {timer > 0 ? (
          <>
            <span>Resend in</span>
            <span className="resend-timer">{fmtTimer(timer)}</span>
          </>
        ) : (
          <button
            className="resend-btn"
            id="resend-btn"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>

      <div className="security-row">
        <span>🛡️</span>
        <span>5 attempts max · expires in 5 min · one-time use</span>
      </div>
    </div>
  );
}

/* ── LoginPage ───────────────────────────────── */
export default function LoginPage() {
  const [step,        setStep]        = useState('email'); // 'email' | 'otp'
  const [otpContext,  setOtpContext]  = useState(null);

  const handleEmailSuccess = ({ email, resendAfter }) => {
    setOtpContext({ email, resendAfter });
    setStep('otp');
  };

  return (
    <div className="page">
      <div className="card">
        {/* Brand */}
        <div className="brand">
          <div className="brand-logo">📬</div>
          <span className="brand-name">OTPost</span>
          <span className="brand-tagline">Passwordless · Secure · Simple</span>
        </div>

        {/* Progress */}
        <div className="progress-dots" aria-hidden="true">
          <div className={`progress-dot ${step === 'email' ? 'active' : ''}`} />
          <div className={`progress-dot ${step === 'otp' ? 'active' : ''}`} />
        </div>

        {step === 'email' ? (
          <EmailStep onSuccess={handleEmailSuccess} />
        ) : (
          <OtpStep
            email={otpContext.email}
            resendAfter={otpContext.resendAfter}
            onBack={() => setStep('email')}
          />
        )}
      </div>
    </div>
  );
}
