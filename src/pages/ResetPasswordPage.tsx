import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { userService } from "@/services/userService";
import { BirdIcon } from "@/components/icons/Icon";
import styles from "./LoginPage.module.css";

const isValidPassword = (value: string) => {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { sendCode } = useAuth();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
      await sendCode(phone.trim(), "reset");
      toast.success("验证码已发送");
      setCountdown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "验证码发送失败");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!phone.trim()) {
      toast.error("手机号不能为空！");
      return;
    }
    if (!code.trim()) {
      toast.error("请输入验证码！");
      return;
    }
    if (!isValidPassword(newPassword)) {
      toast.error("密码至少8位，且需包含字母和数字");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      await userService.resetPassword({
        phone: phone.trim(),
        code: code.trim(),
        newPassword
      });
      toast.success("密码已重置，请用新密码登录");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重置失败");
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
          <h1 className={styles.name}>重置密码</h1>
          <p className={styles.slogan}>验证身份后设置一个新密码</p>
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
              placeholder="请输入注册时的手机号"
              type="tel"
              maxLength={11}
              autoComplete="tel"
            />
          </div>

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
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="newPassword">
              新密码
            </label>
            <input
              id="newPassword"
              className={styles.input}
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              placeholder="至少8位，包含字母和数字"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">
              确认新密码
            </label>
            <input
              id="confirm"
              className={styles.input}
              value={confirm}
              onChange={event => setConfirm(event.target.value)}
              placeholder="请再次输入新密码"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "提交中..." : "重置密码"}
          </button>

          <div className={styles.footLink}>
            <button type="button" onClick={() => navigate("/login")}>
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
