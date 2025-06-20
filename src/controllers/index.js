const getAllItems = (req, res) => {
    // Logic to retrieve all items from the database
    res.send("Retrieve all items");
};

const createItem = (req, res) => {
    // Logic to create a new item in the database
    res.send("Create a new item");
};

export {
    getAllItems,
    createItem
};