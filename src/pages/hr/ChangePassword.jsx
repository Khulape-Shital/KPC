import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { motion, AnimatePresence } from "framer-motion";

import {
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    CheckCircle,
    KeyRound,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const colors = {
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryLight: "#EFF4FF",
    bg: "#F6F8FB",
    card: "#FFFFFF",
    border: "#E4E9F1",
    text: "#0F172A",
    textMuted: "#64748B",
    textFaint: "#94A3B8",
    red: "#DC2626",
    redBg: "#FEF2F2",
    orange: "#F59E0B",
    green: "#16A34A",
    greenBg: "#F0FDF4",
};

function getStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (pwd.length === 0) return { label: "", pct: 0, color: colors.border };
    if (score <= 2) return { label: "Weak", pct: 33, color: colors.red };
    if (score <= 4) return { label: "Medium", pct: 66, color: colors.orange };
    return { label: "Strong", pct: 100, color: colors.green };
}

// ---------------------------------------------------------------------------
// Typing animation for the greeting
// ---------------------------------------------------------------------------
function TypingGreeting({ text }) {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {
        setDisplayed("");
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(interval);
        }, 55);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <span style={{ display: "inline-flex", alignItems: "center" }}>
            {displayed}
            <motion.span
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{
                    display: "inline-block",
                    width: 3,
                    height: "0.9em",
                    marginLeft: 4,
                    background: colors.primary,
                    borderRadius: 1,
                }}
            />
        </span>
    );
}

function PasswordField({
    label,
    placeholder,
    value,
    onChange,
    show,
    onToggleShow,
    focused,
    onFocus,
    onBlur,
    error,
}) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label
                style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: 6,
                }}
            >
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <Lock
                    size={16}
                    color={focused ? colors.primary : colors.textFaint}
                    style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        transition: "color 0.2s ease",
                    }}
                />
                <motion.input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    animate={{
                        borderColor: error
                            ? colors.red
                            : focused
                                ? colors.primary
                                : colors.border,
                        boxShadow: focused
                            ? `0 0 0 3px ${colors.primaryLight}`
                            : "0 0 0 0px rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.18 }}
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 42px",
                        fontSize: 14,
                        borderRadius: 10,
                        border: "1.5px solid",
                        outline: "none",
                        color: colors.text,
                        background: "#FCFDFE",
                        fontFamily: "inherit",
                    }}
                />
                <button
                    type="button"
                    onClick={onToggleShow}
                    aria-label={show ? "Hide password" : "Show password"}
                    style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        color: colors.textFaint,
                    }}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

function RequirementRow({ met, label }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 0",
            }}
        >
            <motion.div
                animate={{
                    backgroundColor: met ? colors.green : "#E2E8F0",
                    scale: met ? 1 : 0.9,
                }}
                transition={{ duration: 0.2 }}
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {met && <CheckCircle size={16} color={colors.green} strokeWidth={2.5} style={{ marginLeft: -0.5, marginTop: -0.5 }} />}
            </motion.div>
            <span
                style={{
                    fontSize: 13,
                    color: met ? colors.text : colors.textMuted,
                    fontWeight: met ? 500 : 400,
                    transition: "color 0.2s ease",
                }}
            >
                {label}
            </span>
        </div>
    );
}

export function HRChangePassword() {
    const navigate = useNavigate();

    const session = JSON.parse(
        localStorage.getItem("kpc_session")
    );

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [touched, setTouched] = useState(false);

    const requirements = {
        length: newPassword.length >= 8,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const allRequirementsMet = Object.values(requirements).every(Boolean);
    const passwordsMatch =
        confirmPassword.length > 0 && newPassword === confirmPassword;
    const showMismatch =
        touched && confirmPassword.length > 0 && !passwordsMatch;

    const strength = getStrength(newPassword);
    const canSubmit = allRequirementsMet && passwordsMatch && !loading;

    useEffect(() => {

        if (!success) return;

        const updatedSession = {
            ...session,
            passwordChanged: true
        };

        localStorage.setItem(
            "kpc_session",
            JSON.stringify(updatedSession)
        );

        const timer = setTimeout(() => {
            navigate("/hr/dashboard");
        }, 2000);

        return () => clearTimeout(timer);

    }, [success, navigate]);

    async function handleSubmit(e) {

        e.preventDefault();

        if (!canSubmit) return;

        setLoading(true);

        const { error } = await supabase
            .from("hr_accounts")
            .update({
                password: newPassword,
                password_changed: true
            })
            .eq("id", session.hrId);

        setLoading(false);

        if (error) {
            console.error(error);
            return;
        }

        setSuccess(true);

    }

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background:
                    "linear-gradient(90deg, #fdfdfd, #6fbce5ff)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                padding: "32px 16px",
                boxSizing: "border-box",
            }}
        >
            {/* Greeting + context — outside the card */}
            {!success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        textAlign: "left",
                        marginBottom: 20,
                        alignSelf: "flex-start",
                        paddingLeft: 0,
                        marginLeft: 0,
                    }}
                >
                    <div
                        style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: colors.textMuted,
                            letterSpacing: 0.3,
                        }}
                    >
                        Welcome to KPC,
                    </div>
                    <div
                        style={{
                            fontSize: 26,
                            fontWeight: 700,
                            color: colors.text,
                            marginTop: 2,
                            minHeight: 32,
                        }}
                    >
                        <TypingGreeting text={session?.userName || "there"} />
                    </div>
                    {/* <div
                        style={{
                            marginTop: 14,
                            fontSize: 13,
                            color: "#334155",
                            lineHeight: 1.6,
                            maxWidth: 460,
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        Your HR account was created by your Operations Manager. For
                        security, please change your temporary password before
                        continuing to the dashboard. This is a one-time setup — it
                        takes less than 30 seconds.
                    </div> */}
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        style={{
                            width: "100%",
                            maxWidth: 700,
                            background: colors.card,
                            borderRadius: 16,
                            boxShadow:
                                "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.08)",
                            border: `1px solid ${colors.border}`,
                            padding: "36px 32px 28px",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* Sub-header */}
                        {/* <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: colors.textFaint,
                                    lineHeight: 1.5,
                                }}
                            >
                                Knowledge Process Center
                                <br />
                                Verification Management System
                            </div>
                        </div> */}

                        <div
                            style={{
                                height: 1,
                                background: colors.border,
                                margin: "20px 0",
                            }}
                        />

                        {/* Icon + title */}
                        <div style={{ textAlign: "center", marginBottom: 22 }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    background: colors.primaryLight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 12px",
                                }}
                            >
                                <ShieldCheck size={24} color={colors.primary} />
                            </div>
                            <div
                                style={{
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: colors.text,
                                }}
                            >
                                First Login Security Setup
                            </div>
                            <div
                                style={{
                                    fontSize: 12.5,
                                    color: colors.textMuted,
                                    marginTop: 4,
                                    padding: "0 12px",
                                    lineHeight: 1.5,
                                }}
                            >
                                For security reasons you must create your own password
                                before accessing the dashboard.
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <PasswordField
                                label="New Password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                show={showNew}
                                onToggleShow={() => setShowNew((s) => !s)}
                                focused={focusedField === "new"}
                                onFocus={() => setFocusedField("new")}
                                onBlur={() => setFocusedField(null)}
                            />
                            <PasswordField
                                label="Confirm Password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setTouched(true);
                                }}
                                show={showConfirm}
                                onToggleShow={() => setShowConfirm((s) => !s)}
                                focused={focusedField === "confirm"}
                                onFocus={() => setFocusedField("confirm")}
                                onBlur={() => setFocusedField(null)}
                                error={showMismatch}
                            />

                            <AnimatePresence>
                                {showMismatch && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{
                                            fontSize: 12.5,
                                            color: colors.red,
                                            marginTop: -10,
                                            marginBottom: 14,
                                        }}
                                    >
                                        Passwords do not match.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Strength meter */}
                            {newPassword.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: colors.textMuted,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Password strength
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: strength.color,
                                            }}
                                        >
                                            {strength.label}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: 6,
                                            borderRadius: 4,
                                            background: "#E9EDF3",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                width: `${strength.pct}%`,
                                                backgroundColor: strength.color,
                                            }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            style={{ height: "100%", borderRadius: 4 }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Requirements card */}
                            <div
                                style={{
                                    background: "#FAFBFD",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 12,
                                    padding: "14px 16px",
                                    marginBottom: 22,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: colors.textMuted,
                                        marginBottom: 8,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.4,
                                    }}
                                >
                                    Requirements
                                </div>
                                <RequirementRow met={requirements.length} label="Minimum 8 characters" />
                                <RequirementRow met={requirements.upper} label="One uppercase letter" />
                                <RequirementRow met={requirements.lower} label="One lowercase letter" />
                                <RequirementRow met={requirements.number} label="One number" />
                                <RequirementRow met={requirements.special} label="One special character" />
                            </div>

                            <motion.button
                                type="submit"
                                disabled={!canSubmit}
                                whileTap={canSubmit ? { scale: 0.98 } : {}}
                                style={{
                                    width: "100%",
                                    padding: "13px 0",
                                    borderRadius: 10,
                                    border: "none",
                                    fontSize: 14.5,
                                    fontWeight: 600,
                                    color: "#fff",
                                    cursor: canSubmit ? "pointer" : "not-allowed",
                                    background: canSubmit
                                        ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                                        : "#B9C4D6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    boxShadow: canSubmit
                                        ? "0 4px 14px rgba(37, 99, 235, 0.28)"
                                        : "none",
                                    transition: "background 0.2s ease, box-shadow 0.2s ease",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.8,
                                                ease: "linear",
                                            }}
                                            style={{
                                                width: 15,
                                                height: 15,
                                                border: "2px solid rgba(255,255,255,0.4)",
                                                borderTopColor: "#fff",
                                                borderRadius: "50%",
                                                display: "inline-block",
                                            }}
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound size={16} />
                                        Change Password
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div
                            style={{
                                textAlign: "center",
                                marginTop: 24,
                                fontSize: 11,
                                color: colors.textFaint,
                                lineHeight: 1.6,
                            }}
                        >
                            © 2026 KPC Verification System
                            <br />
                            Secure Authentication Portal
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            background: colors.card,
                            borderRadius: 16,
                            boxShadow:
                                "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.08)",
                            border: `1px solid ${colors.border}`,
                            padding: "48px 32px",
                            textAlign: "center",
                            boxSizing: "border-box",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: colors.greenBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 20px",
                            }}
                        >
                            <CheckCircle size={34} color={colors.green} strokeWidth={2} />
                        </motion.div>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: colors.text,
                                marginBottom: 6,
                            }}
                        >
                            Password Changed Successfully
                        </div>
                        <div style={{ fontSize: 13, color: colors.textMuted }}>
                            Redirecting to Dashboard...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default HRChangePassword;