import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export default function DebugSession() {
    const { data: me, isLoading: loadingMe, error: meError } = useQuery({
        queryKey: ["/api/auth/me"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        retry: false,
    });

    const { data: debug, isLoading: loadingDebug } = useQuery({
        queryKey: ["/api/debug/echo-cookies"],
        queryFn: async () => {
            const res = await fetch("/api/debug/echo-cookies", { credentials: "include" });
            if (!res.ok) throw new Error("debug failed");
            return res.json();
        },
        retry: false,
    });

    const doRefresh = async () => {
        try {
            await apiRequest("POST", "/api/auth/refresh");
            // refetch queries by doing a window location reload to make behavior obvious
            window.location.reload();
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Debug: Sessão</h1>

            <div className="mb-4">
                <button
                    onClick={doRefresh}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                    Forçar /api/auth/refresh
                </button>
            </div>

            <section className="mb-6">
                <h2 className="font-semibold">/api/auth/me</h2>
                {loadingMe ? (
                    <p>Carregando...</p>
                ) : meError ? (
                    <pre>{String(meError)}</pre>
                ) : (
                    <pre>{JSON.stringify(me, null, 2)}</pre>
                )}
            </section>

            <section>
                <h2 className="font-semibold">/api/debug/echo-cookies</h2>
                {loadingDebug ? <p>Carregando...</p> : <pre>{JSON.stringify(debug, null, 2)}</pre>}
            </section>
        </div>
    );
}
