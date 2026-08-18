import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BirdIcon, CheckIcon } from "@/components/icons/Icon";
import styles from "./LoginPage.module.css";

type LocationState = {
  from?: string;
};

type Mode = "code" | "password";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, sendCode, user, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("code");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | undefined)?.from ?? "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, navigate, from]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      toast.error("手机号不能为空");
      return;
    }
    try {
      await sendCode(phone.trim());
      toast.success("验证码已发送");
      setCountdown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "验证码发送失败");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agreed) {
      toast.error("请先确认阅读用户协议！");
      return;
    }
    if (!phone.trim()) {
      toast.error("手机号和验证码不能为空！");
      return;
    }
    if (mode === "code" && !code.trim()) {
      toast.error("手机号和验证码不能为空！");
      return;
    }
    if (mode === "password" && !password) {
      toast.error("请输入密码");
      return;
    }
    setSubmitting(true);
    try {
      await login(
        mode === "code"
          ? { phone: phone.trim(), code: code.trim() }
          : { phone: phone.trim(), password }
      );
      toast.success("登录成功，欢迎回来");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.decor1} />
      <div className={styles.decor2} />
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <BirdIcon size={34} />
          </div>
          <h1 className={styles.name}>雀跃</h1>
          <p className={styles.slogan}>沉寂已久的心情，掀起了雀跃</p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "code" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode("code")}
          >
            验证码登录
          </button>
          <button
            type="button"
            className={mode === "password" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode("password")}
          >
            密码登录
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              手机号
            </label>
            <input
              id="phone"
              className={styles.input}
              value={phone}
              onChange={event => setPhone(event.target.value)}
              placeholder="请输入手机号"
              type="tel"
              maxLength={11}
              autoComplete="tel"
            />
          </div>

          {mode === "code" ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="code">
                验证码
              </label>
              <div className={styles.codeRow}>
                <input
                  id="code"
                  className={styles.input}
                  value={code}
                  onChange={event => setCode(event.target.value)}
                  placeholder="请输入验证码"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  className={styles.codeButton}
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${countdown}秒后可重发` : "发送验证码"}
                </button>
              </div>
              <span className={styles.tips}>未注册的手机号码验证后自动创建账户</span>
            </div>
          ) : (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                密码
              </label>
              <input
                id="password"
                className={styles.input}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="请输入密码"
                type="password"
                autoComplete="current-password"
              />
            </div>
          )}

          <div className={styles.agreementRow}>
            <button
              type="button"
              className={agreed ? `${styles.checkbox} ${styles.checkboxOn}` : styles.checkbox}
              onClick={() => setAgreed(!agreed)}
              aria-label="同意用户协议"
            >
              {agreed ? <CheckIcon size={13} /> : null}
            </button>
            <span className={styles.agreement}>
              我已阅读并同意《雀跃用户服务协议》、《隐私政策》等
            </span>
          </div>

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "登录中..." : "登录"}
          </button>

          <div className={styles.footLink}>
            <button type="button" onClick={() => navigate("/")}>
              先随便逛逛
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
