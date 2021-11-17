import './App.css';
import ReactCalendarHeatmap from "./ReactCalendarHeatmap";
import D3BarChart from "./D3BarChart";
import D3CalendarHeatmap from "./D3CalendarHeatmap";

function App() {
    return (
    <div className="App">
        <header className="App-header" >
            <div className="App-row-1">
                <div className="App-column-graph">
                    {/*<D3CalendarHeatmap/>*/}
                </div>
                <div className="App-column-barchart">
                    <D3BarChart/>
                    {/*<ReactBarChart/>*/}
                </div>
            </div>
            <div className="App-row-2">
                <ReactCalendarHeatmap/>
                {/*<D3CalendarHeatmap/>*/}

            </div>
        </header>
    </div>
  );
}

export default App;
