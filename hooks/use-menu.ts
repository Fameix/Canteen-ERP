"use client"

import { useState, useEffect, useMemo } from "react"
import type { MenuItem, Category } from "@/lib/types"
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, initializeSeeds } from "@/lib/storage"

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeSeeds()
    setItems(getMenuItems())
    setCategories(getCategories())
    setLoading(false)
  }, [])

  const availableItems = useMemo(() => items.filter(i => i.isAvailable), [items])

  function toggleAvailability(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const updated = { ...item, isAvailable: !item.isAvailable, updatedAt: new Date().toISOString() }
    updateMenuItem(updated)
    setItems(prev => prev.map(i => i.id === itemId ? updated : i))
  }

  function updateItem(updated: MenuItem) {
    updateMenuItem(updated)
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  function createItem(item: MenuItem) {
    addMenuItem(item)
    setItems(prev => [...prev, item])
  }

  function refreshItems() {
    setItems(getMenuItems())
    setCategories(getCategories())
  }

  return { items, availableItems, categories, loading, toggleAvailability, updateItem, createItem, refreshItems }
}
