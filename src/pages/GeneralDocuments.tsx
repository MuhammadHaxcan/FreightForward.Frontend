import { MainLayout } from "@/components/layout/MainLayout";
import { GeneralDocumentsTable } from "@/components/general-documents/GeneralDocumentsTable";

const GeneralDocuments = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <GeneralDocumentsTable />
      </div>
    </MainLayout>
  );
};

export default GeneralDocuments;
