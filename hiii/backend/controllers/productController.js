const Product = require('../models/Product');

const mockProducts = [
  { productName: 'Urea Fertilizer 50kg', website: 'amazon', price: 300, rating: 4.2, url: 'https://amazon.in', category: 'fertilizer' },
  { productName: 'Urea Fertilizer 50kg', website: 'flipkart', price: 280, rating: 4.0, url: 'https://flipkart.com', category: 'fertilizer' },
  { productName: 'Urea Fertilizer 50kg', website: 'local_agri_store', price: 260, rating: 4.5, url: '#', category: 'fertilizer' },
  { productName: 'DAP Fertilizer 50kg', website: 'amazon', price: 1350, rating: 4.3, url: 'https://amazon.in', category: 'fertilizer' },
  { productName: 'DAP Fertilizer 50kg', website: 'flipkart', price: 1300, rating: 4.1, url: 'https://flipkart.com', category: 'fertilizer' },
  { productName: 'DAP Fertilizer 50kg', website: 'local_agri_store', price: 1250, rating: 4.6, url: '#', category: 'fertilizer' },
  { productName: 'Basmati Rice Seeds', website: 'amazon', price: 450, rating: 4.4, url: 'https://amazon.in', category: 'seeds' },
  { productName: 'Basmati Rice Seeds', website: 'flipkart', price: 420, rating: 4.2, url: 'https://flipkart.com', category: 'seeds' },
  { productName: 'Basmati Rice Seeds', website: 'local_agri_store', price: 400, rating: 4.7, url: '#', category: 'seeds' },
  { productName: 'Hybrid Cotton Seeds', website: 'amazon', price: 750, rating: 4.1, url: 'https://amazon.in', category: 'seeds' },
  { productName: 'Hybrid Cotton Seeds', website: 'flipkart', price: 700, rating: 4.0, url: 'https://flipkart.com', category: 'seeds' },
  { productName: 'Hybrid Cotton Seeds', website: 'local_agri_store', price: 680, rating: 4.5, url: '#', category: 'seeds' },
  { productName: 'Insecticide Pesticide 1L', website: 'amazon', price: 550, rating: 4.3, url: 'https://amazon.in', category: 'pesticide' },
  { productName: 'Insecticide Pesticide 1L', website: 'flipkart', price: 520, rating: 4.1, url: 'https://flipkart.com', category: 'pesticide' },
  { productName: 'Insecticide Pesticide 1L', website: 'local_agri_store', price: 500, rating: 4.6, url: '#', category: 'pesticide' },
  { productName: 'Fungicide Pesticide 500ml', website: 'amazon', price: 380, rating: 4.2, url: 'https://amazon.in', category: 'pesticide' },
  { productName: 'Fungicide Pesticide 500ml', website: 'flipkart', price: 360, rating: 4.0, url: 'https://flipkart.com', category: 'pesticide' },
  { productName: 'Fungicide Pesticide 500ml', website: 'local_agri_store', price: 350, rating: 4.4, url: '#', category: 'pesticide' },
  { productName: 'Organic Compost 50kg', website: 'amazon', price: 400, rating: 4.5, url: 'https://amazon.in', category: 'fertilizer' },
  { productName: 'Organic Compost 50kg', website: 'flipkart', price: 380, rating: 4.3, url: 'https://flipkart.com', category: 'fertilizer' },
  { productName: 'Organic Compost 50kg', website: 'local_agri_store', price: 350, rating: 4.7, url: '#', category: 'fertilizer' },
  { productName: 'Spray Pump Manual', website: 'amazon', price: 1200, rating: 4.0, url: 'https://amazon.in', category: 'equipment' },
  { productName: 'Spray Pump Manual', website: 'flipkart', price: 1100, rating: 3.9, url: 'https://flipkart.com', category: 'equipment' },
  { productName: 'Spray Pump Manual', website: 'local_agri_store', price: 950, rating: 4.4, url: '#', category: 'equipment' }
];

exports.initializeProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(mockProducts);
      return res.json({ success: true, message: 'Products initialized' });
    }
    res.json({ success: true, message: 'Products already exist', count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q, category } = req.query;

    let query = {};
    if (q) {
      query.productName = { $regex: q, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }

    let products = await Product.find(query).sort({ price: 1 });

    if (products.length === 0) {
      const mockResults = mockProducts.filter(p => 
        (!q || p.productName.toLowerCase().includes(q.toLowerCase())) &&
        (!category || p.category === category)
      );
      products = mockResults;
    }

    const grouped = {};
    products.forEach(p => {
      if (!grouped[p.productName]) {
        grouped[p.productName] = [];
      }
      grouped[p.productName].push(p);
    });

    const results = Object.values(grouped).map(items => {
      const cheapest = items.reduce((min, p) => p.price < min.price ? p : min);
      const highestRated = items.reduce((max, p) => p.rating > max.rating ? p : max);
      
      items.forEach(item => {
        item.bestValueScore = (item.rating * 10) - (item.price / 100);
      });
      const bestValue = items.reduce((max, p) => p.bestValueScore > max.bestValueScore ? p : max);

      return {
        productName: items[0].productName,
        category: items[0].category,
        options: items,
        cheapest,
        highestRated,
        bestValue
      };
    });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.compareProducts = async (req, res) => {
  try {
    const { productName } = req.body;

    let products = await Product.find({ 
      productName: { $regex: productName, $options: 'i' } 
    });

    if (products.length === 0) {
      products = mockProducts.filter(p => 
        p.productName.toLowerCase().includes(productName.toLowerCase())
      );
    }

    const comparison = {
      productName,
      sources: products.map(p => ({
        website: p.website,
        price: p.price,
        rating: p.rating,
        url: p.url,
        bestValueScore: (p.rating * 10) - (p.price / 100)
      })),
      cheapest: products.reduce((min, p) => p.price < min.price ? p : products[0]),
      highestRated: products.reduce((max, p) => p.rating > max.rating ? p : products[0]),
      bestOverall: products.reduce((max, p) => {
        const score = (p.rating * 10) - (p.price / 100);
        const maxScore = (max.rating * 10) - (max.price / 100);
        return score > maxScore ? p : max;
      })
    };

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = ['fertilizer', 'seeds', 'pesticide', 'equipment'];
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
