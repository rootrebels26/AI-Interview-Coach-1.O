from app.services.question_generator import generate_interview_questions, generate_dynamic_followup_question
from app.services.conversation_manager import process_conversational_turn

def run_tests():
    print("--- Testing Data Engineer Questions ---")
    qs_data = generate_interview_questions("Google", "Data Engineer", "Technical", "Hard")
    print(f"Total questions generated: {len(qs_data)}")
    for q in qs_data[:5]:
        print(f"Q{q['question_number']} ({q['part_title']}): {q['question_text']}")

    print("\n--- Testing Fabric Engineer Questions ---")
    qs_fabric = generate_interview_questions("Microsoft", "Fabric Engineer", "Technical", "Hard")
    for q in qs_fabric[:5]:
        print(f"Q{q['question_number']} ({q['part_title']}): {q['question_text']}")

    print("\n--- Testing Dynamic Follow-up Q12 ---")
    dyn = generate_dynamic_followup_question(
        question_number=12,
        company="Google",
        role="Data Engineer",
        difficulty="Hard",
        interview_type="Technical",
        previous_questions=qs_data[-2:],
        previous_answers=["I used Spark broadcast hash joins to avoid shuffle overhead."],
    )
    print(f"Q12: {dyn['question_text']}")

    print("\n--- Testing Conversational Turn with Hint Request ---")
    conv_hint = process_conversational_turn(
        company="Google",
        role="Data Engineer",
        difficulty="Hard",
        question_number=1,
        question_text=qs_data[0]["question_text"],
        expected_concepts=qs_data[0]["expected_concepts"],
        candidate_message="I am stuck and not sure how partition skew works. Can you help me with a hint?",
        dialogue_history=[],
        request_hint=True,
    )
    print("Interviewer Reply:", conv_hint["interviewer_reply"])
    print("Intent:", conv_hint["intent"])
    print("Hint:", conv_hint["hint"])

if __name__ == "__main__":
    run_tests()
