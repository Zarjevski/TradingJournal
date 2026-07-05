import React from "react";
import Link from "next/link";
import Skeleton from "../common/Skeleton";
import { useUserContext } from "@/context/UserContext";
import { useModalContext } from "@/context/ModalContext";
import Button from "@/components/ui/Button";
import ExchangeCard from "./ExchangeCard";
import FormHeader from "../forms/FormHeader";
import { FaWallet } from "react-icons/fa";

const ChooseExchange = ({
  colorMode,
  setExchange,
}: {
  colorMode: string;
  setExchange: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const [active, setActive] = React.useState({ id: "", title: "" });
  const { isLoading, user }: any = useUserContext();
  const { setIsOpen } = useModalContext();
  const mutedText = colorMode === "light" ? "text-gray-500" : "text-gray-400";

  return (
    <div
      className={`w-full rounded-xl border overflow-hidden ${
        colorMode === "light" ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <FormHeader title="Choose an account" />
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} hieght="h-24" width="w-full" />
            ))}
          </div>
        ) : user?.exchanges?.length > 0 ? (
          <>
            <p className={`text-sm mb-4 ${mutedText}`}>
              Which account is this trade for?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {user.exchanges.map((exchange: any) => (
                <ExchangeCard
                  title={exchange.exchangeName}
                  image={exchange.image}
                  key={exchange.id}
                  id={exchange.id}
                  active={active}
                  setActive={setActive}
                  colorMode={colorMode}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className={`text-center py-10 rounded-lg border ${
              colorMode === "light" ? "bg-zinc-50 border-zinc-200" : "bg-zinc-800/50 border-zinc-700"
            }`}
          >
            <FaWallet className={`mx-auto text-2xl mb-3 ${mutedText}`} />
            <p className="font-medium mb-1">No accounts yet</p>
            <p className={`text-sm mb-4 ${mutedText}`}>
              Add a trading account before logging your first trade.
            </p>
            <Link href="/accounts" onClick={() => setIsOpen(false)}>
              <Button type="button">Add Account</Button>
            </Link>
          </div>
        )}
      </div>
      {user?.exchanges?.length > 0 && (
        <div
          className={`px-6 py-4 border-t flex justify-end ${
            colorMode === "light" ? "border-zinc-200" : "border-zinc-800"
          }`}
        >
          <Button type="button" disabled={!active.id} onClick={() => setExchange(active)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChooseExchange;
