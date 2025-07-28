import { Col, Row, Table, Spinner, Alert, Card, Dropdown } from "react-bootstrap";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import SideBar from "./SideBar";
import { getReportCombination } from "../api/project_report";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [chartType, setChartType] = useState("bar");
  
  const {
    data: chartData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reportCombination"],
    queryFn: async () => {
      const response = await getReportCombination();
      return response.data.data;
    },
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  // Custom label function for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="report_combination" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="report_count" fill="#0088FE" name="Report Count" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="report_count"
                nameKey="report_combination"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Table striped bordered hover responsive className="mt-4">
            <thead className="table-dark">
              <tr>
                <th>S.NO</th>
                <th>Report Combination</th>
                <th>Report Count</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((report, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{report.report_combination}</td>
                  <td>{report.report_count}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
    }
  };

  return (
    <>
      <Row>
        <Col md={2}>
          <SideBar />
        </Col>
        <Col md={10}>
          <div className="container mt-5">
            <h2 className="mb-4">Report Combination Summary</h2>

            {/* Chart Type Selector */}
            <Card className="mb-4">
              <Card.Header>
                <h5>Visualization Options</h5>
              </Card.Header>
              <Card.Body>
                <Dropdown>
                  <Dropdown.Toggle variant="primary" id="dropdown-basic">
                    {chartType === "bar" ? "Bar Chart" :
                     chartType === "pie" ? "Pie Chart" : "Table"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item 
                      active={chartType === "bar"}
                      onClick={() => setChartType("bar")}
                    >
                      Bar Chart
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={chartType === "pie"}
                      onClick={() => setChartType("pie")}
                    >
                      Pie Chart
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={chartType === "table"}
                      onClick={() => setChartType("table")}
                    >
                      Table
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Body>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="d-flex justify-content-center my-4">
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <Alert variant="danger" className="mt-3">
                Error: {error.message}
              </Alert>
            )}

            {/* Data Visualization */}
            {!isLoading && chartData?.length > 0 && (
              <Card>
                <Card.Header>
                  <h5>
                    {chartType === "bar" ? "Bar Chart" :
                     chartType === "pie" ? "Pie Chart" : "Data Table"}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {renderChart()}
                </Card.Body>
              </Card>
            )}

            {/* No Data State */}
            {!isLoading && chartData?.length === 0 && (
              <Alert variant="info">No data available</Alert>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;