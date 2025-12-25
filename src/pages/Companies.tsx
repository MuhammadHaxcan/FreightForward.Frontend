import { MainLayout } from "@/components/layout/MainLayout";
import { CompaniesTable } from "@/components/companies/CompaniesTable";

const Companies = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <CompaniesTable />
      </div>
    </MainLayout>
  );
};

export default Companies;
