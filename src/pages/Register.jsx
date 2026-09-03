import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AuthLayout from '@/components/AuthLayout';
import StepIndicator from '@/components/configurator/StepIndicator';
import BasicInfoStep from '@/components/register/BasicInfoStep';
import FittingStep from '@/components/register/FittingStep';
import PreferencesStep from '@/components/register/PreferencesStep';
import OtpStep from '@/components/register/OtpStep';
import RegisterSuccess from '@/components/register/RegisterSuccess';
import { friendlyError } from '@/lib/errorMessages';
import { toast } from '@/components/ui/use-toast';

const STEP_KEYS = ['basics', 'fitting', 'preferences', 'otp'];
const STEP_LABELS = ['פרטים', 'מידות', 'העדפות', 'אימות'];

const META = {
  basics: { title: 'יצירת חשבון', subtitle: 'שלב 1 מתוך 4 - בוא נכיר אותך' },
  fitting: { title: 'התאמת מידות', subtitle: 'שלב 2 מתוך 4 - נתאים לך חולצות בדיוק' },
  preferences: { title: 'העדפות כדורגל', subtitle: 'שלב 3 מתוך 4 - נדייק עבורך' },
  otp: { title: 'אימות אימייל', subtitle: 'שלב 4 מתוך 4 - כמעט סיימנו' },
};

const DEFAULT_FITTING = { height: '', weight: '', body_build: '', usual_size: '', fit_preference: 'regular' };
const DEFAULT_PREFS = { favorite_teams: [], favorite_players: [], shirt_styles: [] };

export default function Register() {
  const [step, setStep] = useState('basics');
  const [basics, setBasics] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [fitting, setFitting] = useState({ ...DEFAULT_FITTING });
  const [preferences, setPreferences] = useState({ ...DEFAULT_PREFS });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  const currentIdx = STEP_KEYS.indexOf(step);

  const updateBasics = (f, v) => setBasics((p) => ({ ...p, [f]: v }));
  const updateFitting = (f, v) => setFitting((p) => ({ ...p, [f]: v }));
  const updatePreferences = (f, v) => setPreferences((p) => ({ ...p, [f]: v }));

  const handleGoogle = () => base44.auth.loginWithProvider('google', '/');

  const buildProfilePayload = () => ({
    full_name: basics.full_name.trim(),
    height: fitting.height ? Number(fitting.height) : undefined,
    weight: fitting.weight ? Number(fitting.weight) : undefined,
    body_build: fitting.body_build || '',
    usual_size: fitting.usual_size || '',
    fit_preference: fitting.fit_preference || 'regular',
    favorite_teams: preferences.favorite_teams,
    favorite_players: preferences.favorite_players,
    shirt_styles: preferences.shirt_styles,
  });

  const handleFinish = async (prefsOverride) => {
    setError('');
    setLoading(true);
    try {
      await base44.auth.register({ email: basics.email, password: basics.password, full_name: basics.full_name.trim() });
      if (prefsOverride) setPreferences(prefsOverride);
      setStep('otp');
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('exist') || msg.includes('registered') || msg.includes('duplicate')) {
        setError('כתובת האימייל כבר רשומה. נסה להתחבר או להשתמש באימייל אחר.');
      } else {
        setError(friendlyError(err, 'ההרשמה נכשלה. נסה שוב בעוד רגע.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: basics.email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      try {
        await base44.entities.CustomerProfile.create(buildProfilePayload());
      } catch (e) {
        // profile save failure shouldn't block the successful registration
      }
      setStep('success');
    } catch (err) {
      setError(friendlyError(err, 'קוד האימות שגוי או פג תוקף. נסה שוב או בקש קוד חדש.'));
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownTimer.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await base44.auth.resendOtp(basics.email);
      toast({ title: 'הקוד נשלח', description: 'בדוק את תיבת האימייל שלך' });
      startCooldown();
    } catch (err) {
      setError(friendlyError(err, 'שליחת הקוד נכשלה. נסה שוב בעוד רגע.'));
    }
  };

  const finishRedirect = () => { window.location.href = '/'; };

  if (step === 'success') {
    return (
      <AuthLayout title="ברוך הבא!" subtitle="החשבון שלך מוכן">
        <RegisterSuccess onDone={finishRedirect} />
      </AuthLayout>
    );
  }

  const meta = META[step];
  const showFooter = step !== 'otp';

  return (
    <AuthLayout
      title={meta.title}
      subtitle={meta.subtitle}
      footer={showFooter ? (
        <>
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="text-[#E8622A] font-bold hover:underline">התחבר</Link>
        </>
      ) : null}
    >
      <StepIndicator steps={STEP_LABELS} current={currentIdx} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'basics' && (
            <BasicInfoStep
              data={basics}
              onChange={updateBasics}
              onContinue={() => setStep('fitting')}
              onGoogle={handleGoogle}
            />
          )}
          {step === 'fitting' && (
            <FittingStep
              data={fitting}
              onChange={updateFitting}
              onContinue={() => setStep('preferences')}
              onBack={() => setStep('basics')}
            />
          )}
          {step === 'preferences' && (
            <PreferencesStep
              data={preferences}
              onChange={updatePreferences}
              onFinish={() => handleFinish()}
              onSkip={() => handleFinish({ ...DEFAULT_PREFS })}
              onBack={() => setStep('fitting')}
              loading={loading}
              error={error}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              email={basics.email}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              onVerify={handleVerify}
              onResend={handleResend}
              loading={loading}
              error={error}
              resendCooldown={resendCooldown}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}