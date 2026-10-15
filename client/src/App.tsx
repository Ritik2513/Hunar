import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./lib/api";
import type {
  Candidate,
  Communication,
  CommunicationStatus,
} from "./types/candidate";

type ApiCandidateList =
  | Candidate[]
  | {
      candidates?: Candidate[];
      items?: Candidate[];
      data?: Candidate[];
    };

function extractCandidates(value: ApiCandidateList): Candidate[] {
  if (Array.isArray(value)) return value;
  return value.candidates ?? value.items ?? value.data ?? [];
}

function formatMessageDate(date?: string): string {
  if (!date) return "NA";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "NA";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function StatusBadge({ status }: { status: CommunicationStatus }) {
  const styles: Record<CommunicationStatus, string> = {
    sending: "bg-amber-50 text-amber-700",
    sent: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    read: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-600",
  };

  const labels: Record<CommunicationStatus, string> = {
    sending: "Sending",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    failed: "Failed",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status === "read" || status === "delivered" ? "✓ " : ""}
      {labels[status]}
    </span>
  );
}

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [latestCommunications, setLatestCommunications] = useState<
    Record<string, Communication | null>
  >({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState<"message" | "candidate" | null>(null);
  const [message, setMessage] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateJobTitle, setCandidateJobTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());

      const suffix = query.size ? `?${query.toString()}` : "";
      const response = await apiRequest<ApiCandidateList>(
        `/candidates${suffix}`,
      );

      const nextCandidates = extractCandidates(response.data);
      setCandidates(nextCandidates);

      const historyEntries = await Promise.all(
        nextCandidates.map(async (candidate) => {
          try {
            const historyResponse = await apiRequest<Communication[]>(
              `/communications/candidate/${candidate._id}`,
            );

            const history = historyResponse.data;

            return [
              candidate._id,
              history.length > 0 ? history[0] : null,
            ] as const;
          } catch {
            // Do not invent a status when history cannot be fetched.
            return [candidate._id, null] as const;
          }
        }),
      );

      setLatestCommunications(Object.fromEntries(historyEntries));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load candidates.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCandidates(), 250);
    return () => window.clearTimeout(timer);
  }, [loadCandidates]);

  const selectedCandidates = useMemo(
    () => candidates.filter((candidate) => selectedIds.includes(candidate._id)),
    [candidates, selectedIds],
  );

  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const visibleCandidates = candidates.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  function toggleCandidate(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleVisibleCandidates() {
    const visibleIds = visibleCandidates.map((candidate) => candidate._id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  }

  async function handleAddCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");

    try {
      await apiRequest<Candidate>("/candidates", {
        method: "POST",
        body: JSON.stringify({
          name: candidateName.trim(),
          email: candidateEmail.trim(),
          phone: candidatePhone.trim(),
          jobTitle: candidateJobTitle.trim(),
        }),
      });

      setDrawer(null);
      setCandidateName("");
      setCandidateEmail("");
      setCandidatePhone("");
      setCandidateJobTitle("");
      setNotice("Candidate added successfully.");
      await loadCandidates();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to add candidate.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCandidates.length || !message.trim()) return;

    setSubmitting(true);
    setNotice("");

    try {
      const body = message.trim();

      const response =
        selectedCandidates.length === 1
          ? await apiRequest<unknown>("/communications/send", {
              method: "POST",
              body: JSON.stringify({
                candidateId: selectedCandidates[0]._id,
                channel: "sms",
                body,
              }),
            })
          : await apiRequest<unknown>("/communications/bulk", {
              method: "POST",
              body: JSON.stringify({
                candidateIds: selectedCandidates.map(
                  (candidate) => candidate._id,
                ),
                channel: "sms",
                body,
              }),
            });

      setNotice(
        response.success
          ? `Message request submitted for ${selectedCandidates.length} candidate(s).`
          : "The API did not confirm the message request.",
      );
      setDrawer(null);
      setMessage("");
      setSelectedIds([]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;

    const candidatesToDelete = candidates.filter((candidate) =>
      selectedIds.includes(candidate._id),
    );

    const confirmed = window.confirm(
      `Delete ${candidatesToDelete.length} selected candidate(s)? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setSubmitting(true);
    setNotice("");

    try {
      const results = await Promise.allSettled(
        candidatesToDelete.map((candidate) =>
          apiRequest<void>(`/candidates/${candidate._id}`, {
            method: "DELETE",
          }),
        ),
      );

      const deletedIds = candidatesToDelete
        .filter((_, index) => results[index].status === "fulfilled")
        .map((candidate) => candidate._id);

      const failedCount = results.length - deletedIds.length;

      // Remove successfully deleted candidates immediately.
      setCandidates((current) =>
        current.filter((candidate) => !deletedIds.includes(candidate._id)),
      );

      setSelectedIds((current) =>
        current.filter((id) => !deletedIds.includes(id)),
      );

      setLatestCommunications((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => !deletedIds.includes(id)),
        ),
      );

      if (failedCount === 0) {
        setNotice(`${deletedIds.length} candidate(s) deleted successfully.`);
      } else {
        setNotice(
          `${deletedIds.length} deleted successfully; ${failedCount} failed. Please try again for the remaining candidates.`,
        );
      }

      // Refresh to reconcile the UI with the backend.
      await loadCandidates();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#292929]">
      <header className="flex flex-col gap-4 border-b border-[#e5e5e5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="shrink-0 text-2xl font-semibold tracking-tight">
          Candidate communication
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setDrawer("candidate");
            }}
            className="inline-flex h-10 items-center gap-2 rounded border border-[#90c5ff] px-4 text-sm font-medium text-[#1683f8] hover:bg-blue-50"
          >
            <span className="text-xl leading-none">+</span>
            ADD CANDIDATE
          </button>

          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={() => void handleDeleteSelected()}
            className="inline-flex h-10 items-center gap-2 rounded bg-[#e5e5e5] px-4 text-sm font-medium text-[#777] enabled:hover:bg-[#d8d8d8] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span aria-hidden="true">▤</span>
            DELETE CANDIDATE
          </button>

          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={() => {
              setNotice("");
              setDrawer("message");
            }}
            className="inline-flex h-10 items-center gap-2 rounded bg-[#e5e5e5] px-4 text-sm font-medium text-[#777] enabled:bg-[#4285e8] enabled:text-white enabled:hover:bg-[#3274d4] disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">➤</span>
            SEND MESSAGE
          </button>

          <label className="flex h-10 min-w-48 items-center gap-2 rounded border border-[#d0d0d0] px-3 lg:w-64">
            <span aria-hidden="true" className="text-lg">
              ⌕
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search candidates"
              className="w-full min-w-0 outline-none placeholder:text-[#777]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>
        </div>
      </header>

      <section className="m-0 min-h-[calc(100vh-80px)] rounded-b-md bg-[#f5f5f5] p-2">
        {notice && (
          <div className="mb-2 flex items-center justify-between rounded border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              type="button"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              className="underline"
              onClick={() => void loadCandidates()}
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-[#f5f5f5]">
              <tr className="h-[53px] border-b border-[#d0d0d0]">
                <th className="w-14 px-5">
                  <input
                    type="checkbox"
                    aria-label="Select visible candidates"
                    checked={
                      visibleCandidates.length > 0 &&
                      visibleCandidates.every((candidate) =>
                        selectedIds.includes(candidate._id),
                      )
                    }
                    onChange={toggleVisibleCandidates}
                    className="h-4 w-4 accent-[#4285e8]"
                  />
                </th>
                {[
                  "Full name",
                  "Email",
                  "Mobile number",
                  "Last message",
                  "Status",
                  "Candidate ID",
                ].map((heading) => (
                  <th key={heading} className="px-4 font-semibold">
                    <div className="flex items-center justify-between gap-3">
                      {heading}
                      <span className="text-[#999]" aria-hidden="true">
                        ≡
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-[#888]">
                    Loading candidates…
                  </td>
                </tr>
              )}

              {!loading && !error && visibleCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-[#888]">
                    {search
                      ? "No candidates match your search."
                      : "No candidates yet. Select Add Candidate to get started."}
                  </td>
                </tr>
              )}

              {!loading &&
                visibleCandidates.map((candidate) => (
                  <tr
                    key={candidate._id}
                    className={`h-[47px] border-b border-[#ededed] hover:bg-blue-50 ${
                      selectedIds.includes(candidate._id)
                        ? "bg-[#dceeff]"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${candidate.name}`}
                        checked={selectedIds.includes(candidate._id)}
                        onChange={() => toggleCandidate(candidate._id)}
                        className="h-4 w-4 accent-[#4285e8]"
                      />
                    </td>
                    <td className="px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIds([candidate._id]);
                          setDrawer("message");
                        }}
                        className="text-left font-medium text-[#387de0] hover:underline"
                      >
                        {candidate.name}
                      </button>
                    </td>
                    <td className="px-4">{candidate.email || "—"}</td>
                    <td className="px-4">{candidate.phone || "—"}</td>

                    <td className="px-4">
                      {formatMessageDate(
                        latestCommunications[candidate._id]?.createdAt,
                      )}
                    </td>

                    <td className="px-4">
                      {latestCommunications[candidate._id] ? (
                        <StatusBadge
                          status={latestCommunications[candidate._id]!.status}
                        />
                      ) : (
                        <span className="text-[#999]">NA</span>
                      )}
                    </td>

                    <td className="px-4 font-medium">
                      {candidate._id.slice(-6).toUpperCase()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-5 bg-white px-5 py-5 text-sm text-[#555]">
          <label className="flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded bg-white p-1 outline-none"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            {candidates.length === 0
              ? "0 of 0"
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, candidates.length)} of ${candidates.length}`}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(1)}
              aria-label="First page"
              className="disabled:opacity-30"
            >
              |‹
            </button>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              aria-label="Previous page"
              className="disabled:opacity-30"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => value + 1)}
              aria-label="Next page"
              className="disabled:opacity-30"
            >
              ›
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage(pageCount)}
              aria-label="Last page"
              className="disabled:opacity-30"
            >
              ›|
            </button>
          </div>
        </footer>
      </section>

      {drawer && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => setDrawer(null)}
            className="absolute inset-0 h-full w-full bg-black/25 backdrop-blur-[3px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[730px] flex-col bg-white shadow-2xl"
          >
            <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-[#eee] px-7">
              <h2 id="drawer-title" className="text-xl font-semibold">
                {drawer === "message" ? "Send Message" : "Add Candidate"}
              </h2>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                aria-label="Close"
                className="text-3xl font-light text-[#777] hover:text-black"
              >
                ×
              </button>
            </div>

            {drawer === "message" ? (
              <form
                onSubmit={handleSendMessage}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto px-7 py-8">
                  <p className="mb-2 text-base">
                    {selectedCandidates.length} Recipient
                    {selectedCandidates.length === 1 ? "" : "s"}
                  </p>
                  <div className="mb-10 flex flex-wrap gap-2">
                    {selectedCandidates.map((candidate) => (
                      <span
                        key={candidate._id}
                        className="rounded-full bg-[#edf0f2] px-3 py-2 text-sm"
                      >
                        {candidate.name}
                      </span>
                    ))}
                  </div>

                  <label
                    htmlFor="message-body"
                    className="mb-1 block text-base"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-3 text-sm text-[#777]">
                    Type, or paste the message you want to send.
                  </p>
                  <textarea
                    id="message-body"
                    required
                    minLength={1}
                    maxLength={10000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write your message here…"
                    className="min-h-[220px] w-full resize-y rounded border border-[#c9c9c9] p-3 text-base outline-none focus:border-[#4285e8] focus:ring-1 focus:ring-[#4285e8]"
                  />
                  <p className="mt-2 text-right text-xs text-[#888]">
                    {message.length}/10000
                  </p>
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-[#eee] px-7 py-6">
                  <button
                    type="button"
                    onClick={() => setDrawer(null)}
                    className="h-10 rounded border border-[#8bbcff] px-5 text-sm font-medium text-[#1683f8] hover:bg-blue-50"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !message.trim() ||
                      !selectedCandidates.length
                    }
                    className="h-10 rounded bg-[#4285e8] px-5 text-sm font-medium text-white shadow hover:bg-[#3274d4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "SENDING…" : "SEND MESSAGE"}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleAddCandidate}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 space-y-5 overflow-y-auto px-7 py-8">
                  <label className="block text-sm font-medium">
                    Full name <span className="text-red-500">*</span>
                    <input
                      required
                      value={candidateName}
                      onChange={(event) => setCandidateName(event.target.value)}
                      className="mt-2 h-11 w-full rounded border border-[#ccc] px-3 outline-none focus:border-[#4285e8]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                    <input
                      required
                      type="email"
                      value={candidateEmail}
                      onChange={(event) =>
                        setCandidateEmail(event.target.value)
                      }
                      className="mt-2 h-11 w-full rounded border border-[#ccc] px-3 outline-none focus:border-[#4285e8]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Mobile number <span className="text-red-500">*</span>
                    <input
                      required
                      value={candidatePhone}
                      onChange={(event) =>
                        setCandidatePhone(event.target.value)
                      }
                      className="mt-2 h-11 w-full rounded border border-[#ccc] px-3 outline-none focus:border-[#4285e8]"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Job title
                    <input
                      value={candidateJobTitle}
                      onChange={(event) =>
                        setCandidateJobTitle(event.target.value)
                      }
                      className="mt-2 h-11 w-full rounded border border-[#ccc] px-3 outline-none focus:border-[#4285e8]"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-3 border-t border-[#eee] px-7 py-6">
                  <button
                    type="button"
                    onClick={() => setDrawer(null)}
                    className="h-10 rounded border border-[#8bbcff] px-5 text-sm font-medium text-[#1683f8]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 rounded bg-[#4285e8] px-5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {submitting ? "SAVING…" : "ADD CANDIDATE"}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default App;
