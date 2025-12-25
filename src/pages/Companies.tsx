import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AddCompanyForm } from "@/components/companies/AddCompanyForm";
import { CompaniesTable } from "@/components/companies/CompaniesTable";

const Companies = () => {
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
        <AddCompanyForm isExpanded={isFormExpanded} onToggle={toggleForm} />
        <CompaniesTable onAddNew={showForm} isFormExpanded={isFormExpanded} />
      </div>
    </MainLayout>
  );
};

export default Companies;
