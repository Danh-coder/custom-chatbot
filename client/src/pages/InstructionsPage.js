import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const InstructionsPage = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    content: "",
    isDefault: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const { user } = useContext(AuthContext);

  // Load user's instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const res = await axios.get("/api/instructions");
        
        setInstructions(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching instructions:", err);
        setError("Failed to load instructions");
        setLoading(false);
      }
    };

    if (user) {
      fetchInstructions();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      name: "",
      content: "",
      isDefault: false,
    });
    setIsEditing(false);
    setIsFormVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let res;
      if (isEditing) {
        // Update existing instruction
        const { _id, ...updateData } = formData;
        res = await axios.put(`/api/instructions/${_id}`, updateData);

        // Update instructions list
        setInstructions(
          instructions.map((inst) => (inst._id === _id ? res.data : inst))
        );
      } else {
        // Create new instruction
        const { name, content, isDefault } = formData;
        res = await axios.post("/api/instructions", {
          name,
          content,
          isDefault,
        });

        // Add to instructions list
        setInstructions([...instructions, res.data]);
      }

      // Reset form
      resetForm();
    } catch (err) {
      console.error("Error saving instruction:", err);
      setError(err.response?.data?.message || "Failed to save instruction");
    }
  };

  const handleEdit = (instruction) => {
    setFormData({
      _id: instruction._id,
      name: instruction.name,
      content: instruction.content,
      isDefault: instruction.isDefault,
    });
    setIsEditing(true);
    setIsFormVisible(true);
    
    // Scroll to form on mobile
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this instruction?")) {
      return;
    }

    try {
      await axios.delete(`/api/instructions/${id}`);
      setInstructions(instructions.filter((inst) => inst._id !== id));
    } catch (err) {
      console.error("Error deleting instruction:", err);
      setError(err.response?.data?.message || "Failed to delete instruction");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Instructions</h1>
        {!isFormVisible && (
          <button
            onClick={() => setIsFormVisible(true)}
            className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
          >
            Create New Instruction
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Instruction Form */}
      {isFormVisible && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isEditing ? "Edit Instruction" : "Create New Instruction"}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                name="name"
                placeholder="Instruction Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="content"
              >
                Content
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="content"
                name="content"
                rows="6"
                placeholder="Enter your custom instructions here..."
                value={formData.content}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-gray-700">Set as default instruction</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2 sm:mb-0"
              >
                {isEditing ? "Update" : "Create"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">
          Your Instructions
        </h2>

        {instructions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>You haven't created any instructions yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {instructions.map((instruction) => (
              <li key={instruction._id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="mb-3 md:mb-0 md:flex-1 md:mr-4">
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-gray-900 mr-2">
                        {instruction.name}
                      </h3>
                      {instruction.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-3">
                      {instruction.content}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEdit(instruction)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(instruction._id)}
                      className="text-red-600 hover:text-red-800 font-medium transition duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InstructionsPage;