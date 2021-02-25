const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../models/user");
const FeedController = require("../controllers/feed");

describe("Feed Controller", function () {
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

  it("should add a created post to the posts of the creator", function (done) {
    const req = {
      body: {
        title: "Test post",
        content: "Test there!",
      },
      file: {
        path: "abc",
      },
      userId: "5c0f66b979af55031b34728a",
    };

    const res = {
      status: function () {
        return this;
      },
      json: function () {},
    };

    FeedController.createPost(req, res, () => {}).then((savedUser) => {
      expect(savedUser).to.have.property("posts");
      expect(savedUser.posts).to.have.length(1);

      // Wait for code to execute (asynchronus)
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
