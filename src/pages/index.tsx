import { useEffect } from "react";
import { useRouter } from "next/router";
import TitleCard from "@/components/Splash/TitleCard";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/Homepage"); // Replace "/homepage" with the actual path to your Homepage component
    }, 35000); // 35 seconds in milliseconds

    return () => clearTimeout(timeout); // Clear the timeout when the component unmounts
  }, [router]);

  return (
    <>
      <TitleCard />
    </>
  );
};

export default Home;
