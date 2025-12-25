import { MainLayout } from "@/components/layout/MainLayout";
import { BanksTable } from "@/components/banks/BanksTable";

const Banks = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <BanksTable />
      </div>
    </MainLayout>
  );
};

export default Banks;
