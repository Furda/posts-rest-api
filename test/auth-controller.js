const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../models/user");
const AuthController = require("../controllers/auth");

describe("Auth Controller", function () {
  // Run before all test cases
  before(function (done) {
    mongoose
      .connect(
        "mongodb+srv://test:test@shopnodejs.4o4zz.mongodb.net/test-messages",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      )
      .then((result) => {
        const user = new User({
          email: "test@test.com",
          password: "test1",
          name: "Test",
          posts: [],
          _id: "5c0f66b979af55031b34728a",
        });
        return user.save();
      })
      .then(() => {
        done();
      });
  });

  it("should throw an error with code 500 if accessing the database fails", function (done) {
    // Change the findOne property of the User model using stubs
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "test@test.com",
        password: "test1",
      },
    };

    AuthController.login(req, {}, () => {}).then((result) => {
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);

      // Wait for code to execute (asynchronus)
      done();
    });

    // Restore the original findOne property of the User model
    User.findOne.restore();
  });

  it("should send a response with a valid user status for an existing user", function (done) {
    const req = {
      userId: "5c0f66b979af55031b34728a",
    };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };
    AuthController.getStatus(req, res, () => {}).then(() => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal("I am new!");
      done();
    });
  });

  // Run after all test cases
  after(function (done) {
    // Clean up all the user documents in the test database
    User.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
