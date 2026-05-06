/*
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
*/
import PageMeta from '@components/common/PageMeta';

import FilesTable from '@components/tables/FilesTable';

export default function AdminDashboard() {
  return (
    <>
      <PageMeta title="Admin Dashboard" description="Admin Dashboard Page" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7"></div>

        <div className="col-span-12 xl:col-span-5"></div>

        <div className="col-span-12">
          <FilesTable />
        </div>
      </div>
    </>
  );
}
