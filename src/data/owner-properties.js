// src/data/owner-properties.js

export const ownerProperties = [
    // --- PROPERTIES BELONGING TO OWNER 1 (YOU) ---
    {
        id: 101,
        ownerId: 1, // <--- THIS IS YOU
        title: "Executive Annex near NSBM",
        portal: "worker",
        status: "Published",
        price: 35000,
        city: "Homagama",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 102,
        ownerId: 1, // <--- THIS IS YOU
        title: "Girls Boarding - UoM",
        portal: "student",
        status: "Published",
        price: 18000,
        city: "Katubedda",
        image: "https://images.unsplash.com/photo-1596276020587-8044fe049813?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },

    // --- PROPERTIES BELONGING TO OWNER 2 (OTHER PERSON) ---
    // You should NOT see this in your dashboard
    {
        id: 201,
        ownerId: 2, // <--- DIFFERENT OWNER
        title: "Hidden Villa",
        portal: "traveler",
        status: "Published",
        price: 95000,
        city: "Galle",
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];