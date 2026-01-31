import React, { Dispatch, SetStateAction } from "react";
import Skeleton from "../common/Skeleton";
import { useUserContext } from "@/context/UserContext";
import Button from "../common/Button";
import ExchangeCard from "./ExchangeCard";
import FormHeader from "../forms/FormHeader";

const ChooseExchange = ({
  colorMode,
  setExchange,
}: {
  colorMode: string;
  setExchange: Dispatch<SetStateAction<any>>;
}) => {
  const [active, setActive] = React.useState({ id: "", title: "" });
  const { isLoading, user }: any = useUserContext();
  return (
    <div
      className={`w-full rounded border transition-all duration-600 ease-in delay-150 ${
        colorMode === "light" ? "bg-white" : "bg-gray-800"
      }`}
    >
      <FormHeader title={"choose account"}/>
      <div
        className={`h-44 px-4 w-full gap-2  flex flex-wrap overflow-y-auto justify-evenly my-4 font-medium capitalize`}
      >
        {isLoading
          ? [0, 1].map((item, index) => {
              return <Skeleton hieght={"40"} width={"80"} key={index} />;
            })
          : user?.exchanges?.map((exchange: any, index: number) => {
              return (
                <ExchangeCard
                  title={exchange.exchangeName}
                  image={exchange.image}
                  key={index}
                  id={exchange.id}
                  active={active}
                  setActive={setActive}
                />
              );
            })}
      </div>
      <div className="h-12 flex justify-center items-center my-4">
        <Button text="continue" onClick={() => setExchange(active)} />
      </div>
    </div>
  );
};

export default ChooseExchange;
