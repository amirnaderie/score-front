"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { handleInput, validateIranianNationalCode } from "@/app/lib/utility";
import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

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
  data: { scoresRec: ScoreRow[]; ownerName: string };
  message: string;
  statusCode: number;
  error?: string;
}

export default function Home() {
  const [nationalCode, setNationalCode] = useState("");
  const [ownerFullName, setownerFullName] = useState("");
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
    try {
      clearConsumeScores();
      if (!validateIranianNationalCode(Number(nationalCode))) {
        setError("کد ملی معتبر نیست");
        setLoading(false);
        return;
      }
      await fillData(Number(nationalCode));
    } catch (e) {
      toast.error("خطا در عملیات!");
    } finally {
      setLoading(false);
    }
  };

  const fillData = async (nationalCode: number) => {
    try {
      const res = await fetchWithAuthClient(
        `${process.env.NEXT_PUBLIC_API_URL}/score/${nationalCode}`,
        {
          credentials: "include",
        }
      );
      const json: ApiResponse = await res.json();
      if (json.statusCode !== 200) {
        //setError(json.message || json.error || "Unknown error");
        toast.error("خطا در عملیات!");
      } else {
        const { scoresRec: scoresData, ownerName } = json.data;
        if (
          scoresData.length > 0 &&
          (scoresData as any)[0].usedScore &&
          (scoresData as any)[0].usedScore.length > 0
        ) {
          setSelectedIndex(0);
        }
        setData(scoresData);
        setownerFullName(ownerName);
      }
    } catch (error) {
      throw error;
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
      const res = await fetchWithAuthClient(
        `${process.env.NEXT_PUBLIC_API_URL}/score/consume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scoreId,
            score: Number(consumeScores[accountNumber]),
          }),
          credentials: "include",
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
    <div className="flex flex-col items-center  justify-items-center h-full p-8  gap-14 sm:p-20">
      <h1 className="text-2xl font-bold text-amber-700">
        سامانه مدیریت امتیاز تسهیلات
      </h1>
      <div className="flex flex-col gap-y-2  max-w-md ">
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
        <div className="w-full max-w-4xl  flex flex-col gap-y-10 items-center">
          <div className=" w-full rounded-md overflow-hidden">
            <div className="h-14 w-full flex justify-center items-center bg-cyan-50 font-bold">
              نام و نام خانوادگی: {ownerFullName}
            </div>
            <div className="w-full border-collapse ">
              <div className="bg-gray-100 text-sm w-full flex justify-start">
                <span className=" px-3 py-2 w-[25%] text-center">
                  شماره حساب
                </span>
                <span className=" px-3 py-2 w-[20%] text-center">
                  امتیاز قابل استفاده
                </span>
                <span className=" px-3 py-2 w-[20%] text-center">
                  امتیاز قابل انتقال
                </span>
                <span className=" px-3 py-2 w-[25%] text-center">
                  میزان استفاده
                </span>
                <span className=" px-3 py-2 w-[10%] text-center">عملیات</span>
              </div>

              <div className="w-full max-h-[150px] overflow-auto pb-5">
                {data.map((row, idx) => (
                  <div
                    key={row.accountNumber}
                    className={`cursor-pointer w-full flex justify-start ${
                      selectedIndex === idx ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <span className=" px-3 py-2 w-[25%] text-center">
                      {row.accountNumber}
                    </span>
                    <span className=" px-3 py-2  w-[20%] text-center">
                      {Number(row.usableScore).toLocaleString()}
                    </span>
                    <span className=" px-3 py-2  w-[20%] text-center">
                      {Number(row.transferableScore).toLocaleString()}
                    </span>
                    <span className=" py-2 flex justify-center w-[25%]">
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
                    </span>
                    <span className=" px-3 py-2 w-[10%]">
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
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedIndex !== null &&
          data[selectedIndex] &&
          data[selectedIndex].usedScore.length ? (
            <div className="h-[270px] overflow-y-auto w-96">
              <div className="bg-gray-50 p-4 rounded shadow">
                <div className="font-semibold mb-2 text-sm">
                  امتیازهای استفاده شده
                </div>
                {data[selectedIndex].usedScore.length === 0 ? (
                  <div className="text-gray-500">No used scores.</div>
                ) : (
                  <div className="w-full  text-sm">
                    <div className="w-full flex justify-start">
                      <span className="border px-2 py-1 w-[50%] text-center">امتیاز</span>
                      <span className="border px-2 py-1 w-[50%] text-center">تاریخ</span>
                    </div>
                    <div className="w-full">
                      {data[selectedIndex].usedScore.map((u) => (
                        <div key={u.id} className="w-full flex justify-start ">
                          <span className="border px-2 py-1 text-center w-[50%]">
                            {Number(u.score).toLocaleString()}
                          </span>
                          <span className="border px-2 py-1 text-center w-[50%]">
                            {u.createdAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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
