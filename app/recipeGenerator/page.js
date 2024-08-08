'use client';
import { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { firestore } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const MAX_REQUEST_LENGTH = 1000;
const splitText = (text) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_REQUEST_LENGTH) {
    chunks.push(text.substring(i, i + MAX_REQUEST_LENGTH));
  }
  return chunks;
};

const makeApiRequest = async (text, endpoint) => {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyClyd430SwFLkuGRy_7UmJdjdWxGnlDr3I`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: text.map((part) => ({
          parts: [{ text: part }],
        })),
      }),
    });

    const responseBody = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', responseBody);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = JSON.parse(responseBody);
    return data.candidates[0].content.parts.map(part => part.text).join(' ');
  } catch (error) {
    console.error('Error making API request:', error);
    throw new Error('Error making API request');
  }
};



const RecipeGenerator = () => {
  const [anchorEl, setAnchorEl] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState('');
  const [showRecipe, setShowRecipe] = useState(false);
  const [error, setError] = useState('');

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const fetchPantryItems = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(firestore, 'inventory'));
        const items = snapshot.docs.map(doc => doc.id);
        setIngredients(items);
      } catch (error) {
        console.error('Error fetching pantry items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPantryItems();
  }, []);

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      console.log('No ingredients available for recipe generation.');
      return;
    }

    try {
      const ingredientsText = `Create a single recipe using the following ingredients: ${ingredients.join(', ')}.`;
      const chunks = splitText(ingredientsText);
      const results = await Promise.all(chunks.map(chunk => makeApiRequest([chunk], '/api/generateRecipe')));
      setRecipe(results.join(' '));
      setShowRecipe(true);
    } catch (err) {
      console.error('Error generating recipe:', err);
      setError('Error generating recipe');
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      padding={4}
      sx={{ backgroundColor: '#f0f4f8' }}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom={2}
        position="absolute"
        top={16}
        left={16}
      >
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuClick}
        >
          <MenuIcon sx={{ color: 'black' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Link href="/" passHref>
              Pantry Tracker
            </Link>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Link href="/recipeGenerator" passHref>
              Recipe Generator
            </Link>
          </MenuItem>
        </Menu>
      </Box>
      <Typography variant="h2" gutterBottom sx={{ color: '#2c3e50', fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>
        Recipe Generator
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateRecipe}
        sx={{ borderRadius: 4, fontWeight: 600, backgroundColor: '#007bff', '&:hover': { backgroundColor: '#0056b3' } }}
      >
        Generate Recipe
      </Button>
      {showRecipe && (
        <Box
          marginTop={4}
          width="80%"
          maxWidth="600px"
          padding={2}
          sx={{ backgroundColor: '#ffffff', borderRadius: 4, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
            Generated Recipe:
          </Typography>
          <TextField
            multiline
            fullWidth
            rows={6}
            value={recipe}
            variant="outlined"
            InputProps={{ readOnly: true }}
            sx={{ backgroundColor: '#ffffff', borderRadius: 4 }}
          />
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ marginTop: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default RecipeGenerator;
