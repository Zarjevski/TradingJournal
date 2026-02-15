import { useModalContext } from "@/context/ModalContext";

const useResetModal = () => {
  const { setIsOpen } = useModalContext();
  const reset = () => {
    setIsOpen(false);
  };
  return reset;
};

export default useResetModal;
