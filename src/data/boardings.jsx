// src/data/boardings.js

// 1. NEW: Master List of Universities (Add more here as needed)
export const universities = [
    "University of Colombo",
    "University of Sri Jayewardenepura",
    "NSBM Green University",
    "University of Moratuwa",
    "University of Kelaniya",
    "University of Peradeniya",
    "SLIIT Malabe",
    "KDU - Kotelawala Defence University",
    "University of Ruhuna",
    "CINEC Campus",
    "Horizon Campus"
];

// 2. EXISTING: Your Boarding Data (Ensure 'university' matches the names above)
export const boardings = [
  {
    id: 1,
    name: "Luxury Student Hub",
    university: "University of Colombo", // Must match list above exactly
    location: "Colombo 7",
    gender: "female",
    price: 15000,
    rating: 4.8,
    tier: "premium",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.9271, lng: 79.8612 }
  },
  {
    id: 2,
    name: "Green Valley Annex",
    university: "NSBM Green University",
    location: "Pitipana",
    gender: "mixed",
    price: 12000,
    rating: 4.5,
    tier: "premium",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.8211, lng: 80.0409 }
  },
  // --- COLOMBO UNIVERSITY (Colombo Area) ---
  {
    id: 3,
    name: "Luxury Student Hub",
    university: "Colombo University",
    location: "Colombo 7",
    gender: "female",
    price: 15000,
    rating: 4.8,
    tier: "premium",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.9271, lng: 79.8612 }
  },
  {
    id: 4,
    name: "City Boys Hostel",
    university: "Jpura University",
    location: "Bambalapitiya",
    gender: "male",
    price: 8000,
    rating: 4.2,
    tier: "regular",
    image: "https://images.unsplash.com/photo-1522771753035-1a5b6562f3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.8969, lng: 79.8587 }
  },

  // --- NSBM (Homagama Area) ---
  {
    id: 5,
    name: "Green Valley Annex",
    university: "NSBM",
    location: "Pitipana",
    gender: "mixed",
    price: 12000,
    rating: 4.5,
    tier: "premium",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.8211, lng: 80.0409 }
  },
  {
    id: 6,
    name: "Budget Stay",
    university: "NSBM",
    location: "Homagama Town",
    gender: "male",
    price: 5000,
    rating: 3.5,
    tier: "basic",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: { lat: 6.8412, lng: 80.0032 }
  }
];

