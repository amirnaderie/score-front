"use client";
import React, { useState } from "react";
import { handleInput, validateIranianNationalCode } from "./lib/utility";
import toast from "react-hot-toast";

interface UsedScore {
  id: number;
  score: number;
  createdAt: string;
}

interface ScoreRow {
  scoreId: number;
  accountNumber: string;
  usableScore: number;
  transferableScore: number;
  depositType: string;
  usedScore: UsedScore[];
}

interface ApiResponse {
  data: ScoreRow[];
  message: string;
  statusCode: number;
  error?: string;
}

export default function Home() {
  const [nationalCode, setNationalCode] = useState("");
  const [data, setData] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [consumeScores, setConsumeScores] = useState<{ [key: string]: string }>(
    {}
  );
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [saveMsg, setSaveMsg] = useState<{ [key: string]: string }>({});

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setSelectedIndex(null);
    if (!validateIranianNationalCode(Number(nationalCode))) {
      setError("کد ملی معتبر نیست");
      setLoading(false);
      return;
    }
    await fillData(Number(nationalCode));
    try {
    } catch (e) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fillData = async (nationalCode: number) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/score/${nationalCode}`
    );
    const json: ApiResponse = await res.json();
    if (json.statusCode !== 200) {
      setError(json.message || json.error || "Unknown error");
    } else {
      setData(json.data);
    }
  };
  const handleConsumeChange = (accountNumber: string, value: string) => {
    setConsumeScores((prev) => ({ ...prev, [accountNumber]: value }));
  };

  const handleSaveConsume = async (accountNumber: string) => {
    setSaving((prev) => ({ ...prev, [accountNumber]: true }));
    setSaveMsg((prev) => ({ ...prev, [accountNumber]: "" }));
    const scoreId = data.find(
      (scoreItem: ScoreRow) => scoreItem.accountNumber === accountNumber
    )?.scoreId;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/score/consume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scoreId,
            score: Number(consumeScores[accountNumber]),
          }),
        }
      );
      const json = await res.json();
      if (json.statusCode === 200) {
        toast.success("عملیات با موفقیت انجام پذیرفت");
        setSaveMsg((prev) => ({ ...prev, [accountNumber]: "Saved!" }));
        await fillData(Number(nationalCode));
      } else {
        setSaveMsg((prev) => ({
          ...prev,
          [accountNumber]: json.message || "Error",
        }));
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("خطا در عملیات!");
      setSaveMsg((prev) => ({ ...prev, [accountNumber]: "Failed to save" }));
    } finally {
      setSaving((prev) => ({ ...prev, [accountNumber]: false }));
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-10 gap-10 sm:p-20">
      <div className="flex flex-col gap-4 w-full max-w-xl h-1/6">
        <label className="font-semibold">Enter National Code:</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border rounded px-3 py-2 flex-1 ltr"
            onInput={(e) => handleInput(e, 10)}
            value={nationalCode}
            onChange={(e) => setNationalCode(e.target.value)}
            placeholder="National Code"
            maxLength={10}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={handleFetch}
            disabled={loading || !nationalCode}
          >
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </div>

      {data.length > 0 && (
        <div className="w-full max-w-4xl h-2/6 max-h-2/6 ">
          <div className="h-full">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className=" px-3 py-2">Account Number</th>
                  <th className=" px-3 py-2">Usable Score</th>
                  <th className=" px-3 py-2">Transferable Score</th>
                  <th className=" px-3 py-2">Consume Score</th>
                  <th className=" px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={row.accountNumber}
                    className={` cursor-pointer ${
                      selectedIndex === idx ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <td className=" flex justify-center items-center">{row.accountNumber}</td>
                    <td className=" px-3 py-2 ">{Number(row.usableScore).toLocaleString()}</td>
                    <td className=" px-3 py-2 ">
                      {Number(row.transferableScore).toLocaleString()}
                    </td>
                    <td className=" py-2 flex justify-center">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-[70%] ltr "
                        value={consumeScores[row.accountNumber] || ""}
                        onChange={(e) =>
                          handleConsumeChange(row.accountNumber, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className=" px-3 py-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                        disabled={
                          saving[row.accountNumber] ||
                          !consumeScores[row.accountNumber]
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveConsume(row.accountNumber);
                        }}
                      >
                        {saving[row.accountNumber] ? "Saving..." : "Save"}
                      </button>
                      {/* {saveMsg[row.accountNumber] && (
                        <span className="ml-2 text-sm text-gray-600">
                          {saveMsg[row.accountNumber]}
                        </span>
                      )} */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedIndex !== null && data[selectedIndex] && (
            <div className="h-[220px] overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded shadow">
                <div className="font-semibold mb-2">Used Scores</div>
                {data[selectedIndex].usedScore.length === 0 ? (
                  <div className="text-gray-500">No used scores.</div>
                ) : (
                  <table className="w-full border">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Score</th>
                        <th className="border px-2 py-1">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data[selectedIndex].usedScore.map((u) => (
                        <tr key={u.id}>
                          <td className="border px-2 py-1">{Number(u.score).toLocaleString()}</td>
                          <td className="border px-2 py-1">{u.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
