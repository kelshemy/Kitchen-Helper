'use client'
import {useState, useEffect} from "react";
import {Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, CircularProgress, TablePagination, Menu, MenuItem} from "@mui/material";
import {firestore} from "./firebase";
import {collection, doc, getDocs, query, setDoc, deleteDoc, getDoc} from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [search, setSearch] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editQuantity, setEditQuantity] = useState(0);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [alphabeticalOrder, setAlphabeticalOrder] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const updateInventory = async () => {
    setLoading(true);
    try {
      const snapshot = query(collection(firestore, 'inventory'));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });
      setInventory(inventoryList);
      setFilteredInventory(inventoryList);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    let filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    if (filterType === 'lowest') {
      filtered.sort((a, b) => a.quantity - b.quantity);
    } else if (filterType === 'highest') {
      filtered.sort((a, b) => b.quantity - a.quantity);
    }

    if (alphabeticalOrder === 'asc') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (alphabeticalOrder === 'desc') {
      filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredInventory(filtered);
  }, [search, inventory, filterType, alphabeticalOrder]);

  const addItem = async (item, qty) => {
    if (qty <= 0) return;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + qty }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: qty });
    }
    await updateInventory();
  }

  const updateItemQuantity = async (item, delta) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      const newQuantity = quantity + delta;
      if (newQuantity <= 0) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: newQuantity }, { merge: true });
      }
    }
    await updateInventory();
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    await deleteDoc(docRef);
    await updateInventory();
  }

  const editItem = async () => {
    if (editItemName && editQuantity >= 0) {
      const docRef = doc(collection(firestore, 'inventory'), itemToEdit);
      await setDoc(docRef, { name: editItemName, quantity: editQuantity }, { merge: true });
      setItemToEdit(null);
      setEditItemName('');
      setEditQuantity(0);
      await updateInventory();
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedInventory = filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
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
      sx={{ backgroundColor: "#f0f4f8" }}
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
          <MenuItem onClick={() => handleMenuClose()}>
            <Link href="/" passHref>
              Pantry Tracker
            </Link>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose()}>
            <Link href="/recipeGenerator" passHref>
              Recipe Generator
            </Link>
          </MenuItem>
        </Menu>
        <Box display="flex">
          <Link href="/signIn" passHref>
            <Button variant="contained" sx={{ marginRight: 2, borderRadius: 4, fontWeight: 600, backgroundColor: "#007bff", '&:hover': { backgroundColor: "#0056b3" } }}>
              Sign In
            </Button>
          </Link>
          <Link href="/signUp" passHref>
            <Button variant="outlined" sx={{ borderRadius: 4, fontWeight: 600, color: "#007bff", borderColor: "#007bff", '&:hover': { backgroundColor: "#e0f3ff" } }}>
              Sign Up
            </Button>
          </Link>
        </Box>
      </Box>
      <Typography variant="h2" gutterBottom sx={{ color: "#2c3e50", fontWeight: 700, textAlign: 'center' }}>
        Pantry Tracker
      </Typography>
      <Box
        width="90vw"
        maxWidth="1200px"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        gap={4}
        padding={3}
        sx={{ backgroundColor: "#ffffff", borderRadius: 4, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }}
      >

        {/* Search Bar */}
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          sx={{ marginBottom: 2, backgroundColor: "#ffffff", borderRadius: 4 }}
        />

        {/* Filter Buttons */}
        <Stack direction="row" spacing={2} marginBottom={2}>
          <Button
            variant={alphabeticalOrder === 'asc' ? 'contained' : 'outlined'}
            onClick={() => {
              setAlphabeticalOrder('asc');
              setFilterType('');
            }}
            sx={{
              borderRadius: 4,
              fontWeight: 600,
              backgroundColor: alphabeticalOrder === 'asc' ? "#007bff" : "#ffffff",
              color: alphabeticalOrder === 'asc' ? "#ffffff" : "#007bff",
              borderColor: "#007bff",
              '&:hover': {
                backgroundColor: alphabeticalOrder === 'asc' ? "#0056b3" : "#e0f3ff"
              }
            }}
          >
            Alphabetical A-Z
          </Button>
          <Button
            variant={alphabeticalOrder === 'desc' ? 'contained' : 'outlined'}
            onClick={() => {
              setAlphabeticalOrder('desc');
              setFilterType('');
            }}
            sx={{
              borderRadius: 4,
              fontWeight: 600,
              backgroundColor: alphabeticalOrder === 'desc' ? "#007bff" : "#ffffff",
              color: alphabeticalOrder === 'desc' ? "#ffffff" : "#007bff",
              borderColor: "#007bff",
              '&:hover': {
                backgroundColor: alphabeticalOrder === 'desc' ? "#0056b3" : "#e0f3ff"
              }
            }}
          >
            Alphabetical Z-A
          </Button>
          <Button
            variant={filterType === 'lowest' ? 'contained' : 'outlined'}
            onClick={() => {
              setFilterType('lowest');
              setAlphabeticalOrder('');
            }}
            sx={{
              borderRadius: 4,
              fontWeight: 600,
              backgroundColor: filterType === 'lowest' ? "#007bff" : "#ffffff",
              color: filterType === 'lowest' ? "#ffffff" : "#007bff",
              borderColor: "#007bff",
              '&:hover': {
                backgroundColor: filterType === 'lowest' ? "#0056b3" : "#e0f3ff"
              }
            }}
          >
            Lowest Quantity
          </Button>
          <Button
            variant={filterType === 'highest' ? 'contained' : 'outlined'}
            onClick={() => {
              setFilterType('highest');
              setAlphabeticalOrder('');
            }}
            sx={{
              borderRadius: 4,
              fontWeight: 600,
              backgroundColor: filterType === 'highest' ? "#007bff" : "#ffffff",
              color: filterType === 'highest' ? "#ffffff" : "#007bff",
              borderColor: "#007bff",
              '&:hover': {
                backgroundColor: filterType === 'highest' ? "#0056b3" : "#e0f3ff"
              }
            }}
          >
            Highest Quantity
          </Button>
          <Button
            variant={filterType === '' && alphabeticalOrder === '' ? 'contained' : 'outlined'}
            onClick={() => {
              setFilterType('');
              setAlphabeticalOrder('');
            }}
            sx={{
              borderRadius: 4,
              fontWeight: 600,
              backgroundColor: filterType === '' && alphabeticalOrder === '' ? "#007bff" : "#ffffff",
              color: filterType === '' && alphabeticalOrder === '' ? "#ffffff" : "#007bff",
              borderColor: "#007bff",
              '&:hover': {
                backgroundColor: filterType === '' && alphabeticalOrder === '' ? "#0056b3" : "#e0f3ff"
              }
            }}
          >
            Clear Filters
          </Button>
        </Stack>

        {/* Add Item Form */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
          marginBottom={2}
        >
          <TextField
            label="Item Name"
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ backgroundColor: "#ffffff", borderRadius: 4 }}
          />
          <TextField
            label="Quantity"
            variant="outlined"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            sx={{ backgroundColor: "#ffffff", borderRadius: 4 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              addItem(itemName, quantity)
              setItemName('')
              setQuantity(0)
            }}
            sx={{ height: '100%', borderRadius: 4, fontWeight: 600, backgroundColor: "#007bff", '&:hover': { backgroundColor: "#0056b3" } }}
          >
            Add Item
          </Button>
        </Stack>

        {/* Edit Item Form */}
        {itemToEdit && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            marginTop={2}
          >
            <TextField
              label="Edit Item Name"
              variant="outlined"
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              sx={{ backgroundColor: "#ffffff", borderRadius: 4 }}
            />
            <TextField
              label="Edit Quantity"
              variant="outlined"
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value))}
              sx={{ backgroundColor: "#ffffff", borderRadius: 4 }}
            />
            <Button
              variant="contained"
              color="success"
              onClick={editItem}
              sx={{ borderRadius: 4, fontWeight: 600, backgroundColor: "#28a745", '&:hover': { backgroundColor: "#218838" } }}
            >
              Update
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setItemToEdit(null)}
              sx={{ borderRadius: 4, fontWeight: 600, backgroundColor: "#dc3545", '&:hover': { backgroundColor: "#c82333" } }}
            >
              Cancel
            </Button>
          </Stack>
        )}

        {/* Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress sx={{ color: "#007bff" }} />
          </Box>
        )}

        {/* Inventory Table */}
        <Paper square variant="elevation" elevation={4} sx={{ borderRadius: 4 }}>
          <TableContainer sx={{ maxHeight: 400 }}> {/* Set a fixed height for scrolling */}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Item Name</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Quantity</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInventory.length === 0 ? (
                  <TableRow>
                    <TableCell align="center" colSpan={3}>
                      <Typography variant="h6" sx={{ color: "#7f8c8d" }}>No items</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInventory.map(({ name, quantity }) => (
                    <TableRow
                      key={name}
                      sx={{ bgcolor: "#ffffff", '&:hover': { bgcolor: "#f8f9fa" }, transition: 'background-color 0.3s' }}
                    >
                      <TableCell align="center">
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                          <IconButton onClick={() => updateItemQuantity(name, -1)} disabled={quantity <= 1} sx={{ color: "#e74c3c" }}>
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="h6" sx={{ color: "#2c3e50" }}>{quantity}</Typography>
                          <IconButton onClick={() => updateItemQuantity(name, 1)} sx={{ color: "#2ecc71" }}>
                            <AddIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={1}
                        >
                          <IconButton
                            onClick={() => {
                              setItemToEdit(name)
                              setEditItemName(name)
                              setEditQuantity(quantity)
                            }}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => removeItem(name)}
                            sx={{ color: "#e74c3c" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInventory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #ddd' }}
          />
        </Paper>
      </Box>
    </Box>
  );
}