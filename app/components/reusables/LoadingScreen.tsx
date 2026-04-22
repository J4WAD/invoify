"use client";

type LoadingScreenProps = {
    message?: string;
    fullScreen?: boolean;
};

const LoadingScreen = ({
    message = "Chargement…",
    fullScreen = true,
}: LoadingScreenProps) => {
    const wrapperClass = fullScreen
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-4"
        : "flex flex-col items-center justify-center py-16 gap-4";

    return (
        <div className={wrapperClass}>
            <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200"
                style={{ borderTopColor: "#1e3a8a" }}
            />
            <p className="text-sm text-slate-500">{message}</p>
        </div>
    );
};

export default LoadingScreen;
