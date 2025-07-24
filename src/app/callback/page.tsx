"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
//import { UseStore } from "../store/useStore";
//import { useUserStore } from "../store/useUserStore";
import { userType, zarrirUserType } from "../type";
//import { getUserById } from "../actions/userActions";
import { logOut } from "@/app/actions/authActions";
import SpinnerSVG from "../assets/svgs/spinnerSvg";
import toast from "react-hot-toast";
const logout_uri = process.env.NEXT_PUBLIC_SSO_URI;
import Cookies from "js-cookie";

const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //const updateUserId = UseStore((state) => state.updateUserId);
  // const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const signOut = async () => {
    try {
      await logOut();
    } catch (error) {}
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    router.push(`${logout_uri}api/auth/logout`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const codeParameter = searchParams.get("code");
        const stateParameter = searchParams.get("state");
        const StateAuthCookie = sessionStorage.getItem("StateAuthCookie");

        if (codeParameter && StateAuthCookie === stateParameter) {
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ codeParameter }),
          });
          setIsLoading(false);
          if (response.ok) {
            sessionStorage.removeItem("StateAuthCookie");
            const res: zarrirUserType = await response.json();
            console.log(res);
            // updateUserId(res.id!);
            // const user: userType | any = await getUserById(res.id!);
            // setCurrentUser({
            //   id: user.id,
            //   userName: user.userName,
            //   roleId: user.roleId,
            //   isAdmin: user.isAdmin,
            // });
            router.push("/dashboard");
          } else {
            toast.error("خطا در احراز هویت");
            if (response.status === 401) {
              await signOut();
            }
          }
        } else {
          toast.error("خطا در احراز هویت");
          await signOut();
        }
      } catch (error) {
        toast.error("خطا در احراز هویت");
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      {isLoading && <SpinnerSVG className="h-4 w-4 animate-spin text-white" />}
    </div>
  );
};

export default AuthCallback;
