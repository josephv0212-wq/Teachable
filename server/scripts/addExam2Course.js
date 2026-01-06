const { get, run } = require('../db');
require('dotenv').config();

async function addExam2Course() {
  try {
    // Check if course already exists
    const existing = await get('SELECT id FROM courses WHERE courseNumber = ?', ['exam2']);
    if (existing) {
      console.log('Course "exam2" already exists with ID:', existing.id);
      process.exit(0);
    }

    // Private Security Level II Examination - May 2023
    const examData = {
      passingScore: 70,
      timeLimit: 60, // minutes (optional)
      questions: [
        {
          question: 'What are the two types of security officers?',
          options: [
            'Non-Commissioned & Commissioned',
            'Non-Commissioned & Licensed',
            'Licensed & Commissioned',
            'Non-Licensed & Licensed'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'What are the primary responsibilities of security officers?',
          options: [
            'Detain & Arrest',
            'Observe & Report',
            'Give directions & Answer questions',
            'All of the above'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'Appropriate professional appearance for a security officer includes ___________.',
          options: [
            'proper hygiene',
            'good posture',
            'positive attitude',
            'all of the above'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'It is important to know what expressions and phrases trigger negative reactions in yourself.',
          options: [
            'True; it helps you control your reactions when you\'re aware of what bothers you.',
            'True; it lets you come up with good comebacks',
            'False; it\'s better to react emotionally',
            'False; this would not allow you to react instinctively'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'Personal ethics are ___________.',
          options: [
            'the moral framework that guide a person\'s behavior',
            'the rules that your parents gave you',
            'not lying or stealing',
            'all of the above'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'Workplace ethics are __________.',
          options: [
            'the rules that your parents gave you',
            'the values and standards that are to be followed in the workplace',
            'being good at your profession',
            'all of the above'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'Situations that are out of the ordinary and are typically some type of emergency are called __________. Examples include natural disasters, acts of terrorism, robberies, assaults, sabotages, or severe accidents.',
          options: [
            'emergencies',
            'active attacks',
            'critical incidents',
            'panic moments'
          ],
          correctAnswer: 2,
          points: 1
        },
        {
          question: 'SOP stands for __________.',
          options: [
            'study observe pursue',
            'security officer position',
            'standard operating procedure',
            'secure observation post'
          ],
          correctAnswer: 2,
          points: 1
        },
        {
          question: 'All private security officers must display their company name, their own last name, and the word __________ on their outermost garment.',
          options: [
            'Security',
            'Private',
            'Commissioned',
            'Officer'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'Non-lethal weapons include __________.',
          options: [
            'clubs',
            'pepper spray',
            'stun guns',
            'all of the above'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'A security officer\'s right to protect a specific person or area is derived from __________.',
          options: [
            'their license',
            'their uniform',
            'their vehicle',
            'all of the above'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'A security officer wants to start their first shift for a warehouse company. It has been 24 hours since they submitted their application to the state, but the status still reads "not licensed or incomplete application." Can they start their shift at the warehouse?',
          options: [
            'Yes; you are allowed to work after a 24 hour wait',
            'No; you must wait 48 hours before starting work',
            'Yes; you can work immediately after submitting the application',
            'No; you aren\'t allowed to work until the status informs you that you have been accepted'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'A citizen of Texas can make an arrest if they are observing a felony offense taking place, or __________.',
          options: [
            'an offense that is a felony-misdemeanor',
            'an offense that disrupts the public peace',
            'the individual might cause someone harm',
            'all of the above'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'A non-commissioned security officer may carry a firearm __________.',
          options: [
            'if they have their own LTC',
            'if their supervisor approves',
            'any time they are on duty',
            'under no circumstances'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'If a security officer is found guilty of breaking the law, the Department of Public Safety has the authority to ___________.',
          options: [
            'revoke their license',
            'suspend their license',
            'deny their license',
            'all of the above'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'Which of the following is not a part of proper security officer positioning?',
          options: [
            'Distancing',
            'Facing the individual',
            'Staying tense',
            'Looking directly'
          ],
          correctAnswer: 2,
          points: 1
        },
        {
          question: '__________ is a position held by a security officer that includes holding the body in such a way that shows strength, confidence, interest, and control.',
          options: [
            'Posturing',
            'Bowing',
            'Straightening',
            'Crouching'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'The three elements that can readily be observed quickly include behavior, appearance, and __________.',
          options: [
            'environment',
            'emotion',
            'intelligence',
            'none of these'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'In order to identify the meaning of someone\'s statement, you must first identify the __________ and __________.',
          options: [
            'content; intent',
            'content; feeling',
            'intent; tone',
            'background; feeling'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'In the Use of Force Model, the response to resistance includes presence, verbal commands, __________, non-lethal weapons, and lethal force.',
          options: [
            'intermediate weapons',
            'involving police',
            'empty hand control',
            'none of these'
          ],
          correctAnswer: 2,
          points: 1
        },
        {
          question: '__________ is characterized by a force with a high probability of causing death or serious bodily injury.',
          options: [
            'Lethal force',
            'Hard hand controls',
            'Soft controls',
            'Advanced weapons'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'Criminal liability means being held __________.',
          options: [
            'legally responsible for committing a criminal offense',
            'responsible for payment of damages',
            'responsible for how others perceived you',
            'responsible for not stopping a crime in progress'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'It is important to try and gain ________________ to resolve situations without using force.',
          options: [
            'physical submission',
            'complete information',
            'good observations',
            'voluntary compliance'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'A civilian is compelled to provide _____________ if requested by security officers.',
          options: [
            'identification',
            'their name',
            'good advice',
            'nothing'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'Section 9 of the State of Texas Penal Code focuses on ___________.',
          options: [
            'uniforms',
            'use of force',
            'carrying firearms',
            'vehicles'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'It is important to remain __________ when talking on the radio.',
          options: [
            'stern',
            'authoritative',
            'loud',
            'calm'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'Daily reports can be useful for _____________________.',
          options: [
            'informing supervisors about your shift',
            'criminal investigations',
            'reminding yourself what to look for on your next shift',
            'all of the above'
          ],
          correctAnswer: 3,
          points: 1
        },
        {
          question: 'Your reports should be written in the __________ voice.',
          options: [
            'passive',
            'active',
            'neutral',
            'personal'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'You should cover the 5W\'s + 1H in your report, they include __________, When, __________, Who, Where, and How.',
          options: [
            'Whether; Whom',
            'Weather; Whose',
            'Who; What',
            'Wherefore; Which'
          ],
          correctAnswer: 2,
          points: 1
        },
        {
          question: 'Situational awareness is __________________.',
          options: [
            'the ability to understand the circumstances you find yourself in',
            'the ability to predict future situations',
            'the ability to manipulate the circumstances around you to force a certain situation',
            'all of the above'
          ],
          correctAnswer: 0,
          points: 1
        },
        {
          question: 'What action should a security officer make a priority in the event of a medical emergency?',
          options: [
            'Attempt to perform first aid.',
            'Call 911.',
            'Attempt to transport the individual to the nearest hospital.',
            'Call your supervisor.'
          ],
          correctAnswer: 1,
          points: 1
        },
        {
          question: 'What are the 3 actions an individual can take during an active attack event?',
          options: [
            'Attack, Defeat, Destroy',
            'Ambush, Deflect, Dominate',
            'Avoid, Deny, Defend',
            'Assault, Develop, Delay'
          ],
          correctAnswer: 2,
          points: 1
        }
      ]
    };

    // Create the course
    const result = await run(
      `INSERT INTO courses
       (name, description, courseNumber, price, duration, examJson, certificateTemplate, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Private Security Level II Examination',
        'May 2023 - Private Security Level II Examination. This exam contains 32 multiple choice questions covering security officer responsibilities, ethics, use of force, reporting, and emergency procedures.',
        'exam2',
        0.00, // Free for testing
        '1 hour',
        JSON.stringify(examData),
        'Default Certificate Template',
        1 // Active
      ]
    );

    const course = await get('SELECT * FROM courses WHERE id = ?', [result.id]);
    console.log('Course "exam2" created successfully!');
    console.log('Course ID:', course.id);
    console.log('Course Number:', course.courseNumber);
    console.log('Course Name:', course.name);
    console.log('Exam Questions:', JSON.parse(course.examJson).questions.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating course:', error);
    process.exit(1);
  }
}

addExam2Course();

