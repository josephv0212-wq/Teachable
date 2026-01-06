import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const QUESTIONS = [
  {
    question: 'What are the two types of security officers?',
    options: [
      'Non-Commissioned & Commissioned',
      'Non-Commissioned & Licensed',
      'Licensed & Commissioned',
      'Non-Licensed & Licensed',
    ],
    correctIndex: 0,
  },
  {
    question: 'What are the primary responsibilities of security officers?',
    options: [
      'Detain & Arrest',
      'Observe & Report',
      'Give directions & Answer questions',
      'All of the above',
    ],
    correctIndex: 1,
  },
  {
    question:
      'Appropriate professional appearance for a security officer includes ___________.',
    options: ['proper hygiene', 'good posture', 'positive attitude', 'all of the above'],
    correctIndex: 3,
  },
  {
    question:
      'It is important to know what expressions and phrases trigger negative reactions in yourself.',
    options: [
      'True; it helps you control your reactions when you’re aware of what bothers you.',
      'True; it lets you come up with good comebacks',
      'False; it’s better to react emotionally',
      'False; this would not allow you to react instinctively',
    ],
    correctIndex: 0,
  },
  {
    question: 'Personal ethics are ___________.',
    options: [
      'the moral framework that guide a person’s behavior',
      'the rules that your parents gave you',
      'not lying or stealing',
      'all of the above',
    ],
    correctIndex: 0,
  },
  {
    question: 'Workplace ethics are __________.',
    options: [
      'the rules that your parents gave you',
      'the values and standards that are to be followed in the workplace',
      'being good at your profession',
      'all of the above',
    ],
    correctIndex: 1,
  },
  {
    question:
      'Situations that are out of the ordinary and are typically some type of emergency are called __________. Examples include natural disasters, acts of terrorism, robberies, assaults, sabotages, or severe accidents.',
    options: ['emergencies', 'active attacks', 'critical incidents', 'panic moments'],
    correctIndex: 2,
  },
  {
    question: 'SOP stands for __________.',
    options: [
      'study observe pursue',
      'security officer position',
      'standard operating procedure',
      'secure observation post',
    ],
    correctIndex: 2,
  },
  {
    question:
      'All private security officers must display their company name, their own last name, and the word __________ on their outermost garment.',
    options: ['Security', 'Private', 'Commissioned', 'Officer'],
    correctIndex: 0,
  },
  {
    question: 'Non-lethal weapons include __________.',
    options: ['clubs', 'pepper spray', 'stun guns', 'all of the above'],
    correctIndex: 3,
  },
  {
    question:
      'A security officer’s right to protect a specific person or area is derived from __________.',
    options: ['their license', 'their uniform', 'their vehicle', 'all of the above'],
    correctIndex: 0,
  },
  {
    question:
      'A security officer wants to start their first shift for a warehouse company. It has been 24 hours since they submitted their application to the state, but the status still reads “not licensed or incomplete application.” Can they start their shift at the warehouse?',
    options: [
      'Yes; you are allowed to work after a 24 hour wait',
      'No; you must wait 48 hours before starting work',
      'Yes; you can work immediately after submitting the application',
      'No; you aren’t allowed to work until the status informs you that you have been accepted',
    ],
    correctIndex: 3,
  },
  {
    question:
      'A citizen of Texas can make an arrest if they are observing a felony offense taking place, or __________.',
    options: [
      'an offense that is a felony-misdemeanor',
      'an offense that disrupts the public peace',
      'the individual might cause someone harm',
      'all of the above',
    ],
    correctIndex: 1,
  },
  {
    question: 'A non-commissioned security officer may carry a firearm __________.',
    options: [
      'if they have their own LTC',
      'if their supervisor approves',
      'any time they are on duty',
      'under no circumstances',
    ],
    correctIndex: 3,
  },
  {
    question:
      'If a security officer is found guilty of breaking the law, the Department of Public Safety has the authority to ___________.',
    options: [
      'revoke their license',
      'suspend their license',
      'deny their license',
      'all of the above',
    ],
    correctIndex: 3,
  },
  {
    question: 'Which of the following is not a part of proper security officer positioning?',
    options: ['Distancing', 'Facing the individual', 'Staying tense', 'Looking directly'],
    correctIndex: 2,
  },
  {
    question:
      '__________ is a position held by a security officer that includes holding the body in such a way that shows strength, confidence, interest, and control.',
    options: ['Posturing', 'Bowing', 'Straightening', 'Crouching'],
    correctIndex: 0,
  },
  {
    question:
      'The three elements that can readily be observed quickly include behavior, appearance, and __________.',
    options: ['environment', 'emotion', 'intelligence', 'none of these'],
    correctIndex: 0,
  },
  {
    question:
      'In order to identify the meaning of someone’s statement, you must first identify the __________ and __________.',
    options: ['content; intent', 'content; feeling', 'intent; tone', 'background; feeling'],
    correctIndex: 0,
  },
  {
    question:
      'In the Use of Force Model, the response to resistance includes presence, verbal commands, __________, non-lethal weapons, and lethal force.',
    options: ['intermediate weapons', 'involving police', 'empty hand control', 'none of these'],
    correctIndex: 2,
  },
  {
    question:
      '__________ is characterized by a force with a high probability of causing death or serious bodily injury.',
    options: ['Lethal force', 'Hard hand controls', 'Soft controls', 'Advanced weapons'],
    correctIndex: 0,
  },
  {
    question: 'Criminal liability means being held __________.',
    options: [
      'legally responsible for committing a criminal offense',
      'responsible for payment of damages',
      'responsible for how others perceived you',
      'responsible for not stopping a crime in progress',
    ],
    correctIndex: 0,
  },
  {
    question:
      'It is important to try and gain ________________ to resolve situations without using force.',
    options: ['physical submission', 'complete information', 'good observations', 'voluntary compliance'],
    correctIndex: 3,
  },
  {
    question:
      'A civilian is compelled to provide _____________ if requested by security officers.',
    options: ['identification', 'their name', 'good advice', 'nothing'],
    correctIndex: 3,
  },
  {
    question: 'Section 9 of the State of Texas Penal Code focuses on ___________.',
    options: ['uniforms', 'use of force', 'carrying firearms', 'vehicles'],
    correctIndex: 1,
  },
  {
    question: 'It is important to remain __________ when talking on the radio.',
    options: ['stern', 'authoritative', 'loud', 'calm'],
    correctIndex: 3,
  },
  {
    question: 'Daily reports can be useful for _____________________.',
    options: [
      'informing supervisors about your shift',
      'criminal investigations',
      'reminding yourself what to look for on your next shift',
      'all of the above',
    ],
    correctIndex: 3,
  },
  {
    question: 'Your reports should be written in the __________ voice.',
    options: ['passive', 'active', 'neutral', 'personal'],
    correctIndex: 1,
  },
  {
    question:
      'You should cover the 5W’s + 1H in your report, they include __________, When, __________, Who, Where, and How.',
    options: ['Whether; Whom', 'Weather; Whose', 'Who; What', 'Wherefore; Which'],
    correctIndex: 2,
  },
  {
    question: 'Situational awareness is __________________.',
    options: [
      'the ability to understand the circumstances you find yourself in',
      'the ability to predict future situations',
      'the ability to manipulate the circumstances around you to force a certain situation',
      'all of the above',
    ],
    correctIndex: 0,
  },
  {
    question:
      'What action should a security officer make a priority in the event of a medical emergency?',
    options: [
      'Attempt to perform first aid.',
      'Call 911.',
      'Attempt to transport the individual to the nearest hospital.',
      'Call your supervisor.',
    ],
    correctIndex: 1,
  },
  {
    question:
      'What are the 3 actions an individual can take during an active attack event?',
    options: [
      'Attack, Defeat, Destroy',
      'Ambush, Deflect, Dominate',
      'Avoid, Deny, Defend',
      'Assault, Develop, Delay',
    ],
    correctIndex: 2,
  },
]

export default function Level2ExamPage() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleAnswerChange = (qIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: optionIndex,
    }))
  }

  const unansweredCount = QUESTIONS.length - Object.keys(answers).length

  const handleSubmit = e => {
    e.preventDefault()
    if (unansweredCount > 0) return
    setSubmitted(true)
  }

  let score = 0
  if (submitted) {
    QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score += 1
    })
  }
  const percentage = submitted ? (score / QUESTIONS.length) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Private Security Level II Examination
            </h1>
            <p className="text-gray-600 mb-1">May 2023 • 32 Questions • Multiple Choice</p>
            <p className="text-gray-600">
              This sample exam is for practice only and is not an official test.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card">
            <div className="space-y-8">
              {QUESTIONS.map((q, qIndex) => {
                const isCorrect = submitted && answers[qIndex] === q.correctIndex
                const isIncorrect =
                  submitted && answers[qIndex] !== undefined && answers[qIndex] !== q.correctIndex

                return (
                  <div
                    key={qIndex}
                    className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      {qIndex + 1}) {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => {
                        const selected = answers[qIndex] === oIndex
                        const isCorrectOption = submitted && oIndex === q.correctIndex
                        const showAsCorrect = isCorrectOption
                        const showAsWrongSelection =
                          submitted && selected && oIndex !== q.correctIndex

                        return (
                          <label
                            key={oIndex}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition
                              ${
                                selected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }
                              ${
                                showAsCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : showAsWrongSelection
                                  ? 'border-red-500 bg-red-50'
                                  : ''
                              }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              value={oIndex}
                              checked={selected}
                              onChange={() => handleAnswerChange(qIndex, oIndex)}
                              className="mr-3"
                              disabled={submitted}
                            />
                            <span>{String.fromCharCode(97 + oIndex)})&nbsp;{option}</span>
                          </label>
                        )
                      })}
                    </div>
                    {submitted && (
                      <p
                        className={`mt-2 text-sm font-medium ${
                          isCorrect ? 'text-green-700' : isIncorrect ? 'text-red-700' : ''
                        }`}
                      >
                        Correct answer: {String.fromCharCode(97 + q.correctIndex)})
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              {!submitted && (
                <p className="text-sm text-gray-600">
                  {unansweredCount > 0
                    ? `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} remaining.`
                    : 'All questions answered. You can submit your exam.'}
                </p>
              )}

              {submitted && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold">
                      Score: {score} / {QUESTIONS.length} ({percentage.toFixed(1)}%)
                    </p>
                    <p className="text-sm text-gray-600">
                      Passing for Level II in this sample is typically 70%.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({})
                      setSubmitted(false)
                    }}
                    className="btn-primary mt-4 sm:mt-0"
                  >
                    Retake Exam
                  </button>
                </div>
              )}

              {!submitted && (
                <button
                  type="submit"
                  disabled={unansweredCount > 0}
                  className="btn-primary w-full"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}


