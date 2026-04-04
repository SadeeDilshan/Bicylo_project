// src/data/workers.js

// 1. NEW: Master List of Districts for Search
export const districts = [
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Galle",
    "Matara",
    "Kurunegala",
    "Ratnapura",
    "Nuwara Eliya",
    "Anuradhapura",
    "Jaffna"
];

// 2. EXISTING: Worker Listings Data
export const workers = [
  {
    id: 1,
    name: "Executive Annex",
    district: "Colombo", // Must match list above
    city: "Nugegoda",
    price: 35000,
    type: "annex",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Fully furnished annex with separate entrance."
  },
  {
    id: 2,
    name: "City Apartment",
    district: "Colombo",
    city: "Dehiwala",
    price: 65000,
    type: "apartment",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "2 bedroom apartment near Galle Road."
  },
  {
    id: 3,
    name: "Budget Room",
    district: "Gampaha",
    city: "Wattala",
    price: 15000,
    type: "room",
    rating: 3.8,
    image: "https://images.unsplash.com/photo-1596276020587-8044fe049813?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Single room near industrial zone."
  },
  {
    id: 4,
    name: "Hillside House",
    district: "Kandy",
    city: "Peradeniya",
    price: 45000,
    type: "house",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description: "Quiet house for a small family."
  }
];