import { useEffect, useState, createContext } from "react";
import axios from "axios";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backend = "https://quickbites-api.onrender.com";

  const [adminId, setAdminId] = useState(null);
  const [orderData, setOrderData] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [feedbackData, setFeedbackData] = useState([]);
  const [isProfileFetched, setIsProfileFetched] = useState(false); // Track fetch status

  // Load adminId from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminId(parsedAdmin.id);
      } catch (err) {
        console.error("Invalid admin object in localStorage", err);
      }
    }
  }, []);

  const getOrders = async () => {
    try {
      const { data } = await axios.post(`${backend}/api/order/get-all-orders`);
      if (data.success) {
        setOrderData(data.orderData);
        setFeedbackData(
          data.orderData.filter((order) => order.feedback !== "")
        );
      }
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  };

  const getProfile = async () => {
    if (!adminId || isProfileFetched) return; // Prevent multiple fetches
    try {
      const { data } = await axios.get(
        `${backend}/api/auth/admin/getadmin-profile?adminId=${adminId}`
      );
      if (data?.admin) {
        setProfileData(data.admin);
        localStorage.setItem("admin", JSON.stringify({ id: adminId, ...data.admin }));
        setIsProfileFetched(true); // Mark as fetched
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const updateProfile = async (formData) => {
    try {
      const { data } = await axios.put(
        `${backend}/api/auth/admin/updateadmin-profile/${adminId}`,
        formData
      );
      if (data.success) {
        setProfileData(data.admin);
        localStorage.setItem("admin", JSON.stringify({ id: adminId, ...data.admin }));
        setIsProfileFetched(true); // Ensure fetched status is maintained
        return { success: true, admin: data.admin };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error("Error updating profile", err);
      return { success: false, message: "Error updating profile" };
    }
  };

  // Fetch data when adminId is set
  useEffect(() => {
    if (adminId) {
      getOrders();
      getProfile();
    }
  }, [adminId]);

  const values = {
    backend,
    orderData,
    feedbackData,
    profileData,
    setProfileData,
    getProfile,
    updateProfile,
  };

  return (
    <AdminContext.Provider value={values}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
