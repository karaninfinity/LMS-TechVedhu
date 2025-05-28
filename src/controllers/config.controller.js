import prisma from "../../config/prisma.js";

// Get all configurations
export const getConfigs = async (req, res) => {
  try {
    const configs = await prisma.config.findMany();
    const configObj = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    res.json({
      success: true,
      message: "Configs fetched successfully",
      configs: configObj,
    });
  } catch (error) {
    console.error("Error fetching configs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching configs",
    });
  }
};

// Get a specific configuration by key
export const getConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Config with key '${key}' not found`,
      });
    }

    res.json({
      success: true,
      message: "Config fetched successfully",
      config: { key: config.key, value: config.value },
    });
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching config",
    });
  }
};

// Create or update a configuration
export const upsertConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ message: "Key and value are required" });
    }

    const config = await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.status(200).json({
      success: true,
      message: "Config created/updated successfully",
      config,
    });
  } catch (error) {
    console.error("Error creating/updating config:", error);
    res.status(500).json({
      success: false,
      message: "Error creating/updating config",
    });
  }
};

// Update multiple configurations at once
export const updateConfigs = async (req, res) => {
  try {
    const configs = req.body;
    if (!configs || typeof configs !== "object") {
      return res.status(400).json({ message: "Invalid configuration data" });
    }
    console.log(req.body);

    const results = [];
    // Use Promise.all for concurrent updates
    await Promise.all(
      Object.entries(configs).map(async ([key, value]) => {
        console.log(key, value);
        const config = await prisma.config.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
        results.push(config);
      })
    );

    const updatedConfigs = await prisma.config.findMany();
    const updatedConfigsObj = updatedConfigs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    res.json({
      success: true,
      message: "Configurations updated successfully",
      count: results.length,
      configs: updatedConfigsObj,
    });
  } catch (error) {
    console.error("Error updating configs:", error);
    res.status(500).json({
      success: false,
      message: "Error updating configs",
    });
  }
};

// Delete a configuration
export const deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Config with key '${key}' not found`,
      });
    }

    await prisma.config.delete({
      where: { key },
    });

    res.json({
      success: true,
      message: `Config '${key}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting config:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting config",
    });
  }
};
