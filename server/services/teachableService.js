const axios = require('axios');

class TeachableService {
  constructor(apiKey, schoolId) {
    this.apiKey = apiKey;
    this.schoolId = schoolId;
    this.baseURL = 'https://developers.teachable.com/v1';
    this.headers = {
      'apiKey': apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a user in Teachable
   */
  async createUser(userData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/users`,
        {
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          password: userData.password || this.generatePassword()
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Teachable user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enroll a user in a course
   */
  async enrollUser(userId, courseId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/enrollments`,
        {
          user_id: userId,
          course_id: courseId
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error enrolling user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a course in Teachable
   */
  async createCourse(courseData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/courses`,
        {
          name: courseData.name,
          headline: courseData.headline,
          description: courseData.description,
          price: courseData.price,
          published: courseData.published || false
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get course details
   */
  async getCourse(courseId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/courses/${courseId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting course:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user progress in a course
   */
  async getUserProgress(userId, courseId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${userId}/courses/${courseId}/progress`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting user progress:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate a password for new users
   */
  generatePassword() {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }
}

module.exports = TeachableService;

