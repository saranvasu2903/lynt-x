"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Utility function to generate unique IDs
const generateUniqueId = () => {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const FormElementContext = createContext()

export function FormElementProvider({ children, initialElements = [] }) {
  const [formElements, setFormElements] = useState([])

  useEffect(() => {
    if (initialElements && initialElements.length > 0) {
      setFormElements(initialElements)
    }
  }, [initialElements])

  const addElement = (element, parentId = null, index = null) => {
    const newElement = {
      ...element,
      id: generateUniqueId(),
      parentId,
      children: element.children || [],
      properties: { ...element.properties },
    }

    if (parentId) {
      setFormElements((prevElements) => {
        const updateChildren = (elements) => {
          return elements.map((el) => {
            if (el.id === parentId) {
              const newChildren = [...el.children]
              if (index !== null) {
                newChildren.splice(index, 0, newElement)
              } else {
                newChildren.push(newElement)
              }
              return {
                ...el,
                children: newChildren,
              }
            } else if (el.children && el.children.length > 0) {
              return {
                ...el,
                children: updateChildren(el.children),
              }
            }
            return el
          })
        }
        return updateChildren(prevElements)
      })
    } else {
      setFormElements((prevElements) => {
        if (index !== null) {
          const newElements = [...prevElements]
          newElements.splice(index, 0, newElement)
          return newElements
        }
        return [...prevElements, newElement]
      })
    }
  }

  // Enhance the updateElement function to handle nested child-builder elements
  const updateElement = (id, updates) => {
    requestAnimationFrame(() => {
      setFormElements((prevElements) => {
        const updateElementById = (elements) => {
          return elements.map((el) => {
            if (el.id === id) {
              const updatedElement = JSON.parse(JSON.stringify({ ...el, ...updates }))
              return updatedElement
            } else if (el.children && el.children.length > 0) {
              return {
                ...el,
                children: updateElementById(el.children),
              }
            }
            return el
          })
        }
        return updateElementById(prevElements)
      })
    })
  }

  const removeElement = (id) => {
    setFormElements((prevElements) => {
      const removeElementById = (elements) => {
        return elements
          .map((el) => {
            if (el.children && el.children.length > 0) {
              return {
                ...el,
                children: removeElementById(el.children),
              }
            }
            return el
          })
          .filter((el) => el.id !== id)
      }
      return removeElementById(prevElements)
    })
  }

  const moveElement = (id, parentId, newIndex) => {
    setFormElements((prevElements) => {
      let draggedElement = null
      let originalParentId = null

      const findAndRemoveElement = (elements, currentParentId = null) => {
        let foundIndex = -1

        for (let i = 0; i < elements.length; i++) {
          if (elements[i].id === id) {
            draggedElement = { ...elements[i] }
            originalParentId = currentParentId
            foundIndex = i
            break
          }

          if (elements[i].children && elements[i].children.length > 0) {
            const newChildren = findAndRemoveElement(elements[i].children, elements[i].id)
            if (newChildren !== elements[i].children) {
              elements = [...elements.slice(0, i), { ...elements[i], children: newChildren }, ...elements.slice(i + 1)]
              return elements
            }
          }
        }

        if (foundIndex !== -1) {
          return [...elements.slice(0, foundIndex), ...elements.slice(foundIndex + 1)]
        }

        return elements
      }

      const newElements = findAndRemoveElement([...prevElements])

      if (!draggedElement) return prevElements

      if (parentId !== originalParentId) {
        draggedElement.parentId = parentId
      }

      if (parentId) {
        const addToParent = (elements) => {
          return elements.map((el) => {
            if (el.id === parentId) {
              const newChildren = [...el.children]
              const insertIndex = Math.min(Math.max(0, newIndex), newChildren.length)
              newChildren.splice(insertIndex, 0, draggedElement)
              return { ...el, children: newChildren }
            }
            if (el.children && el.children.length > 0) {
              return { ...el, children: addToParent(el.children) }
            }
            return el
          })
        }
        return addToParent(newElements)
      } else {
        const insertIndex = Math.min(Math.max(0, newIndex), newElements.length)
        newElements.splice(insertIndex, 0, draggedElement)
        return newElements
      }
    })
  }

  return (
    <FormElementContext.Provider
      value={{
        formElements,
        addElement,
        updateElement,
        removeElement,
        moveElement,
      }}
    >
      {children}
    </FormElementContext.Provider>
  )
}

export function useFormElements() {
  const context = useContext(FormElementContext)
  if (!context) {
    throw new Error("useFormElements must be used within a FormElementProvider")
  }
  return context
}
