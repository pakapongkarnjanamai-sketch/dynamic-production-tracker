import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Button,
  Input,
  MobileCard,
  SaveMessage,
  Stack,
} from "../components/admin/AdminUI";
import { DetailPageShell } from "../components/layout/PageShell";

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  if (!user) return null;

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const wantsPasswordChange = Boolean(
      currentPassword || newPassword || confirmPassword,
    );

    if (!trimmedName) {
      setSaveMessage("กรุณากรอกชื่อผู้ใช้");
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setSaveMessage("กรุณากรอกรหัสผ่านให้ครบ");
        return;
      }

      if (newPassword.length < 8) {
        setSaveMessage("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
        return;
      }

      if (newPassword !== confirmPassword) {
        setSaveMessage("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
        return;
      }
    }

    const payload = {};

    if (trimmedName !== user.name) {
      payload.name = trimmedName;
    }

    if (wantsPasswordChange) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setSaveMessage("ยังไม่มีข้อมูลที่เปลี่ยนแปลง");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      await updateProfile(payload);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaveMessage("บันทึกข้อมูลสำเร็จ");
    } catch (error) {
      setSaveMessage(error.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailPageShell
      title="แก้ไขข้อมูล"
      onBack={() => navigate("/profile")}
      maxWidth="max-w-4xl"
      className="md:pb-8"
    >
      <Stack className="gap-3 sm:gap-4">
        <MobileCard className="p-3.5 sm:p-4">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSaveProfile}>
            <div className="space-y-1">
              <h1 className="text-base font-bold tracking-[-0.02em] text-neutral-900">
                แก้ไขข้อมูล
              </h1>
              <p className="text-sm text-neutral-500">
                เปลี่ยนชื่อผู้ใช้หรือรหัสผ่าน
              </p>
            </div>

            <SaveMessage message={saveMessage} />

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="ชื่อผู้ใช้"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="กรอกชื่อผู้ใช้"
                autoComplete="name"
              />
              <div className="hidden md:block" />
              <Input
                label="รหัสผ่านปัจจุบัน"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="กรอกเมื่อต้องการเปลี่ยนรหัสผ่าน"
                autoComplete="current-password"
              />
              <Input
                label="รหัสผ่านใหม่"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                autoComplete="new-password"
              />
              <Input
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
          </form>
        </MobileCard>
      </Stack>
    </DetailPageShell>
  );
}
