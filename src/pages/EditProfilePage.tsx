import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/common/Avatar";
import { userService } from "@/services/userService";
import { uploadService } from "@/services/uploadService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { CameraIcon } from "@/components/icons/Icon";
import styles from "./EditProfilePage.module.css";

const genderOptions = [
  { label: "保密", value: "" },
  { label: "男", value: "true" },
  { label: "女", value: "false" }
];

const EditProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [icon, setIcon] = useState("");
  const [nickName, setNickName] = useState("");
  const [city, setCity] = useState("");
  const [introduce, setIntroduce] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/profile/edit" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setIcon(user.icon || "");
    setNickName(user.nickName || "");
    let cancelled = false;
    userService
      .info(user.id)
      .then(data => {
        if (cancelled || !data) return;
        setCity(data.city || "");
        setIntroduce(data.introduce || "");
        setGender(data.gender === null || data.gender === undefined ? "" : String(data.gender));
        setBirthday(data.birthday || "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadService.uploadBlog(file);
      setIcon(`/imgs${path}`);
      toast.success("头像上传成功，保存后生效");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "头像上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!nickName.trim()) {
      toast.error("昵称不能为空");
      return;
    }
    setSaving(true);
    try {
      // 用户详情（UserInfo）更新：PUT /user-info（与后端约定的接口）
      await userService.updateInfo({
        userId: user.id,
        city: city.trim(),
        introduce: introduce.trim(),
        gender: gender === "" ? undefined : gender === "true",
        birthday: birthday || undefined
      });
      await refreshUser();
      toast.success("保存成功");
      navigate("/profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <PageHeader
      title="资料编辑"
      back
      right={
        <button type="button" className={styles.saveBtn} onClick={() => void handleSave()} disabled={saving || uploading}>
          {saving ? "保存中..." : "保存"}
        </button>
      }
    />
  );

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.card}>
        <div className={styles.avatarRow}>
          <span className={styles.label}>头像</span>
          <button type="button" className={styles.avatarBtn} onClick={handleAvatarClick} disabled={uploading}>
            <Avatar src={icon} name={nickName} size={72} />
            <span className={styles.avatarMask}>
              <CameraIcon size={18} />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={event => void handleAvatarSelected(event)}
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.label}>昵称</span>
          <input
            className={styles.input}
            value={nickName}
            onChange={event => setNickName(event.target.value)}
            placeholder="给自己起个好听的昵称"
            maxLength={20}
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.label}>个人介绍</span>
          <textarea
            className={styles.textarea}
            value={introduce}
            onChange={event => setIntroduce(event.target.value)}
            placeholder="介绍一下自己"
            rows={3}
            maxLength={120}
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.label}>性别</span>
          <div className={styles.radioRow}>
            {genderOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={gender === option.value ? `${styles.radio} ${styles.radioOn}` : styles.radio}
                onClick={() => setGender(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.label}>城市</span>
          <input
            className={styles.input}
            value={city}
            onChange={event => setCity(event.target.value)}
            placeholder="你所在的城市"
            maxLength={20}
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.label}>生日</span>
          <input
            className={styles.input}
            type="date"
            value={birthday}
            onChange={event => setBirthday(event.target.value)}
          />
        </div>
      </section>
    </AppLayout>
  );
};

export default EditProfilePage;
