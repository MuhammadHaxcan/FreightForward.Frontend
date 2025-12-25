import { MainLayout } from "@/components/layout/MainLayout";
import { AddCompanyForm } from "@/components/companies/AddCompanyForm";
import { CompaniesTable } from "@/components/companies/CompaniesTable";

const Companies = () => {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <AddCompanyForm />
        <CompaniesTable />
      </div>
    </MainLayout>
  );
};

export default Companies;
