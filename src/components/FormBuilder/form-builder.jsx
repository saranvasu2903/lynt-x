"use client"

import { useDrop } from "react-dnd"
import { useFormElements } from "./form-element-context"
import FormElement from "./form-element"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"

export default function FormBuilderPage({ setSelectedElement, onSubmit, setFormData }) {
  const { formElements, addElement } = useFormElements()
  const [formValues, setFormValues] = useState({})
  const prevFormElementsRef = useRef(JSON.stringify(formElements))

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "form-element",
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop()
      if (didDrop) return

      if (item.isNew) {
        addElement(item.element)
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  }))

  useEffect(() => {
    const formElementsJSON = JSON.stringify(formElements)

    if (prevFormElementsRef.current !== formElementsJSON) {
      setFormData(formElements)
      prevFormElementsRef.current = formElementsJSON
    }
  }, [formElements, setFormData])

  useEffect(() => {
    if (formElements.length === 0) {
      setSelectedElement(null)
    }
  }, [formElements, setSelectedElement])

  const handleInputChange = (elementId, value, parentId = null) => {
    setFormValues((prev) => {
      if (parentId) {
        const parentValues = prev[parentId] || {}
        return {
          ...prev,
          [parentId]: {
            ...parentValues,
            [elementId]: value,
          },
        }
      }
      return {
        ...prev,
        [elementId]: value,
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const completeFormData = {
      values: formValues,
      structure: formElements,
    }

    onSubmit(completeFormData)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
  }

 
  const elementVariants = {
    hidden: { opacity: 0, y: 5 }, 
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50, 
        damping: 12,
        mass: 0.2, 
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: -5, 
      transition: {
        duration: 0.1, 
        ease: "easeOut",
      },
    },
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        ref={drop}
        className={`min-h-[500px] rounded-xl border-2 border-dashed p-4 transition-all ${
          isOver ? "border-indigo-500 bg-indigo-50 shadow-lg" : "border-gray-200 bg-white"
        }`}
      >
        {formElements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} 
            className="flex h-full flex-col items-center justify-center text-center gap-3 py-16"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full  text-indigo-600 shadow-md">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Drop Elements Here</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Drag and drop form elements from the sidebar to start building your form.
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{
              layout: {
                type: "spring",
                stiffness: 50,
                damping: 15,
              },
            }}
            className="space-y-3"
          >
            {formElements.map((element, index) => (
              <motion.div
                key={element.id}
                variants={elementVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 50,
                    damping: 15,
                    duration: 0.2,
                  },
                }}
                style={{ willChange: "transform, opacity" }} 
              >
                <FormElement
                  element={element}
                  index={index}
                  setSelectedElement={setSelectedElement}
                  parentId={null}
                  onChange={(value) => handleInputChange(element.id, value, null)}
                  value={formValues[element.id]}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </form>
  )
}
