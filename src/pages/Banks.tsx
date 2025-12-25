import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AddBankForm } from "@/components/banks/AddBankForm";
import { BanksTable } from "@/components/banks/BanksTable";

const Banks = () => {
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  const toggleForm = () => {
    setIsFormExpanded((prev) => !prev);
  };

  const showForm = () => {
    setIsFormExpanded(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <AddBankForm isExpanded={isFormExpanded} onToggle={toggleForm} />
        <BanksTable onAddNew={showForm} />
      </div>
    </MainLayout>
  );
};

export default Banks;
