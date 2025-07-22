"use client";
import React, { useState } from "react";
import { handleInput, validateIranianNationalCode } from "./lib/utility";
import toast from "react-hot-toast";
import SpinnerSVG from "./assets/svgs/spinnerSvg";

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

  const clearConsumeScores = () => {
    const cleared = Object.keys(consumeScores).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {} as { [key: string]: string });
    setConsumeScores(cleared);
  };
  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setSelectedIndex(null);
    clearConsumeScores();
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
      clearConsumeScores();
      setSaving((prev) => ({ ...prev, [accountNumber]: false }));
    }
  };

  return (
    <div className="flex flex-col items-center  justify-items-center min-h-screen p-8  gap-16 sm:p-20">
      <h1 className="text-2xl font-bold text-amber-700">سامانه مدیریت امتیاز تسهیلات</h1>
      <div className="flex flex-col gap-y-2  max-w-md h-1/6">
        <label className="font-semibold">کد ملی :</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border rounded px-3 py-2 flex-1 ltr w-4/6 placeholder:text-right placeholder:text-xs"
            onInput={(e) => handleInput(e, 10)}
            value={nationalCode}
            onChange={(e) => setNationalCode(e.target.value)}
            placeholder=" کد ملی صاحب امتیاز را وارد نمایید"
            maxLength={10}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && nationalCode) {
                handleFetch();
              }
            }}
          />
          <button
            className="bg-blue-600 text-white w-24  py-2 rounded disabled:opacity-50 flex justify-center items-center"
            onClick={handleFetch}
            disabled={loading || !nationalCode}
          >
            {loading ? (
              <SpinnerSVG className="h-4 w-4 animate-spin text-white" />
            ) : (
              "جستجو"
            )}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      {data.length > 0 && (
        <div className="w-full max-w-4xl h-5/6 max-h-5/6 flex flex-col gap-y-10 items-center ">
          <div className=" h-2/5 w-full ">
            <table className="w-full border-collapse ">
              <thead>
                <tr className="bg-gray-100">
                  <th className=" px-3 py-2">شماره حساب</th>
                  <th className=" px-3 py-2">امتیاز قابل استفاده</th>
                  <th className=" px-3 py-2">امتیاز قابل انتقال</th>
                  <th className=" px-3 py-2">میزان استفاده</th>
                  <th className=" px-3 py-2">عملیات</th>
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
                    <td className=" flex justify-center items-center">
                      {row.accountNumber}
                    </td>
                    <td className=" px-3 py-2 text-center">
                      {Number(row.usableScore).toLocaleString()}
                    </td>
                    <td className=" px-3 py-2 text-center">
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
                        readOnly={!row.usableScore || row.usableScore < 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(idx);
                        }}
                        onInput={(e) => handleInput(e, 9)}
                      />
                    </td>
                    <td className=" px-3 py-2">
                      <button
                        className="bg-green-600 w-full  text-white px-3 py-1 rounded disabled:opacity-50 flex justify-center items-center cursor-pointer"
                        disabled={
                          saving[row.accountNumber] ||
                          !consumeScores[row.accountNumber]
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveConsume(row.accountNumber);
                        }}
                      >
                        {saving[row.accountNumber] ? (
                          <SpinnerSVG className="h-6 w-5 animate-spin text-white" />
                        ) : (
                          "ذخیره"
                        )}
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

          {selectedIndex !== null &&
          data[selectedIndex] &&
          data[selectedIndex].usedScore.length ? (
            <div className="h-[270px] overflow-y-auto w-96">
              <div className="bg-gray-50 p-4 rounded shadow">
                <div className="font-semibold mb-2 text-sm">امتیازهای استفاده شده</div>
                {data[selectedIndex].usedScore.length === 0 ? (
                  <div className="text-gray-500">No used scores.</div>
                ) : (
                  <table className="w-full border text-sm">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">امتیاز</th>
                        <th className="border px-2 py-1">تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data[selectedIndex].usedScore.map((u) => (
                        <tr key={u.id}>
                          <td className="border px-2 py-1 text-center">
                            {Number(u.score).toLocaleString()}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {u.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            data.length > 0 &&
            selectedIndex !== null &&
            !data[selectedIndex].usedScore.length && <div></div>
          )}
        </div>
      )}
    </div>
  );
}
