"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI;
const client_id = process.env.NEXT_PUBLIC_CLIENT_ID;
const login_uri = process.env.NEXT_PUBLIC_SSO_URI;

const rand = () => Math.random().toString(36).substring(2);
export const generateToken = (length: number) =>
  (rand() + rand() + rand() + rand()).substring(0, length);

const Login = () => {
  const router = useRouter();
  const csrfToken = generateToken(32);

  useEffect(() => {
    const load = async () => {
      try {
        sessionStorage.setItem("StateAuthCookie", csrfToken);
        router.push(
          `${login_uri}authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=openid+profile+email+role&state=${csrfToken}`
        );
      } catch (error) {
      }
    };

    load();
  }, []);
  return <div></div>;
};

export default Login;
