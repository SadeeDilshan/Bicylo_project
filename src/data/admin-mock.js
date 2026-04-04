// src/data/admin-mock.js

// 1. OWNERS WAITING FOR APPROVAL
export const pendingOwners = [
    {
        id: 1,
        name: "Kasun Perera",
        email: "kasun@gmail.com",
        phone: "077-1234567",
        date: "2025-10-12",
        idFront: "https://via.placeholder.com/150", // Placeholder for ID Image
        idBack: "https://via.placeholder.com/150",
        selfie: "https://via.placeholder.com/150",
        status: "Pending"
    },
    {
        id: 2,
        name: "Amara Silva",
        email: "amara@yahoo.com",
        phone: "071-9876543",
        date: "2025-10-13",
        idFront: "https://via.placeholder.com/150",
        idBack: "https://via.placeholder.com/150",
        selfie: "https://via.placeholder.com/150",
        status: "Pending"
    }
];

// 2. ADS WAITING FOR APPROVAL
export const pendingAds = [
    {
        id: 105,
        owner: "Kasun Perera",
        title: "Luxury Villa in Ella",
        category: "Traveler",
        price: 45000,
        submitted: "2 hours ago",
        status: "Pending Review"
    },
    {
        id: 106,
        owner: "John Doe",
        title: "Budget Annex Nugegoda",
        category: "Worker",
        price: 25000,
        submitted: "5 hours ago",
        status: "Pending Review"
    }
];