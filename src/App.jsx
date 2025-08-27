import { useState } from "react";
import "./App.css";
import Approutes from "./routes/Approutes";
import {ToastContainer} from 'react-toastify'
import AdminContextProvider from "./Context/AdminContext";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <AdminContextProvider/>
        <ToastContainer/>
          <Approutes />
      </div>
    </>
  );
}

export default App;
