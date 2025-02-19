import React, { useState, useEffect, useRef } from 'react'
import { FaCommentDots, FaPaperPlane } from "react-icons/fa";
import toast from "react-hot-toast";


const SERVER_URI = import.meta.env.VITE_SERVER_URI;

const Feedback = ({name}) => {
    
    const [isFeedbackExpanded, setFeedbackExpanded] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const feedbackRef = useRef(null); // Ref for the feedback section


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (feedbackRef.current && !feedbackRef.current.contains(event.target)) {
              setFeedbackExpanded(false); // Collapse the feedback section
            }
          };
      
          const istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          // console.log(istTime);
      
          document.addEventListener("mousedown", handleClickOutside);

          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    },[])
    
//   const handleFeedbackSubmit = () => {
//     if (feedbackText.trim()) {
//       console.log("Feedback submitted:", feedbackText);

//       setFeedbackText(""); 
//       setFeedbackExpanded(false); // Collapse the feedback section
//     }
//   };


    const handleFeedbackSubmit = async () => {
        
      // console.log("Feedback submitted:",name, feedbackText);
        if (!feedbackText.trim()) {
            toast.error("Feedback cannot be empty!", {
                icon: "⚠️",
            });
            return ;
        }

        try {
          const response = await fetch(`${SERVER_URI}/api/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name:name,
              feedback: feedbackText
            })
          });
    
          if (!response.ok) throw new Error('Submission failed');
          
          setFeedbackText('');
          setFeedbackExpanded(false);
          toast.success('Feedback submitted!');
        } catch (error) {
          toast.error('Failed to submit feedback');
          console.error('Submission error:', error);
        }
    };



    // Ensure the textbox is visible when the keyboard appears
  useEffect(() => {
    if (isFeedbackExpanded && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFeedbackExpanded]);


  const onFeedbackClick = ()=>{
    // console.log(name);          
    if (name.trim()) {
      setFeedbackExpanded(true);
    } else {
      toast.error("Enter name first!", {
        icon: "✏️",
      });
    }
  }


  return (
    <div
        ref={feedbackRef}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 1000, // Ensure it's above other elements
        }}
      >
      
      {isFeedbackExpanded ? (
      <div className="feedback-box show">
        <textarea
        //   type="text"
          placeholder="Your feedback..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          className="feedback-input"
          rows="3"
        />
        <button onClick={handleFeedbackSubmit} className="feedback-send-btn">
          <FaPaperPlane /> Send
        </button>
      </div>
    ) 
    : (
      <button
        onClick={() => onFeedbackClick()}
        className={`feedback-toggle-btn ${!name.trim() ? 'disabled' : '' }`}
      >
        <FaCommentDots size={20} />
      </button>
    )}
    </div>
  )
}

export default Feedback