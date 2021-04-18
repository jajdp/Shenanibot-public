The contents of this directory and its subdirectories provide unit test
coverage for the main functionality of ShenaniBot.  This document outlines
the general testing strategy and the structure of the tests.


RUNNING THE TESTS

Once the bot is installed, in the bot directory you can run

    npm run unittest

This will normally only be of interest to developers attempting to modify
the bot.  These tests do NOT verify that your instance is configured
correctly for your stream; they only give an indication that the bot is
programmed correctly.


TESTING BOUNDARY

The tests cover the core ShenaniBot class and the web server and modules.
They do NOT cover the following:

- the configuration editor and loader; each test provides its own
  configuration when creating a test instance of the bot
- the Twitch platform module (including the tmi chat client and the
  throttling library
- The Levelhead API (including the RumpusCE client library)

These boundaries ensure that tests are quick and flexible, have minimal
impact on the host system (i.e. no interferance with config files), get
predictable results (no dependence on external state which could change
without notice), and run without putting load on remote services.

Additionally, these tests focus on ensuring that the bot's logic is
correct across the various combinations of features and options.  The
messages sent to chat are rarely examined (except for commands whose
entire behavior is to send an informational message).


MOCKING PHILOSOPHY

Within the testing boundary, the tests treat the system as a black box.
This is contrary to many people's understanding of modern unit testing;
but the orignal defintiion of unit tests referred to units of WORK - not
necessarily units of code such as individual classes or functions.

While tests focusing on individual units of code can make it easier to
quickly identify which component is broken, they need to be paired with
higher-level tests to demonstrate functionality of the system as a whole.
More importantly, they tend to be high-maintenance, requiring updates to
reflect any change in the tested system - even when only implementation
details are changing and the desired behavior remains the same.  For a
project based entirely on volunteer contributions, this is not suitable.

By contrast, when tests focus on the behavior as seen from outside the
system, it is possible to modify the implementation in any valid way
(potentially including large refactors) without significantly impacting
the tests.

Consequently, mocks are only used to stand in for (and provide
predictable responses from) services outside the testing boundary.  In
addition to remote services (RumpusCE API), this might include services
provided by the OS and/or standard libraries (such as prng).  Note that
the tests themselves act in the role of the platform module, so there is
currently no need for a twitch/tmi mock.


TESTING FRAMEWORK

These tests are written using jasmine - a popular BDD-oriented JavaScript
testing framework.  While jasmine is often combined with separate mocking
and asserton/matcher libraries, the built-in jasmine functionality has
proven sufficient (at least for now).


TEST FILE LAYOUT

All of the files specifically related to unit testing are under this
directory (spec under the project root).

The jasmine configuration is in ./support/jasmine.json

Various "helper" scripts are kept in ./helpers; jasmine runs these scripts
before starting the unit tests.  These scripts perform three major tasks:

- They ensure that each test starts in a clean state
- They define convenience functions to be called by the tests.  These
  functions are accessed through the context object that jasmine provides
  to each test case
- They inject mocks to replace external services; helpers performing this
  function are in scripts whose names start with "mock".

The ./botCommands directory contains test suites corresponding to commands
the bot can receive.  Most commands have their own file (e.g. the !close
command has close.spec.js); but in cases where one command is only used in
conjunction with another command, a single file may contain the tests that
cover both of them.  (For example, boost.spec.js contains tests covering
the !boost and !giveboost commands.)

The ./botOptions directory contains test suites corresponding to a few of
the configuration options that have distinct behaviors not clearly
associated with any individual command (provided those behaviors fall
within the test boundary defined above).

To demonstrate a behavior may invovle multiple commands and/or options;
in these cases, the general guideline is to put the test in the suite for
the command or option that is most directly defined by that behavior.  For
example, the !add command tests could verify that a submission is rejected
if the viewer has reached the submission limit, but this behavior directly
defines the limit option so the test is in ./botOptions/limit.spec.ts
instead.

(There may be exceptions to the above.  !random has rules involving the
current round, priority, and markers that decide which levels are eligible
to be chosen.  Arguably limiting eligibility for !random is a defining
characteristic of !mark, but the !random eligibility rules are grouped
together in the !random test suite.)

In cases where multiple commands each display a given set of behaviors, a
template-spec file may be used.  (This is somewhat experimental; it is
intended to keep the test code DRY, but it remains to be seen if it makes
the tests too complex, especially in cases where two commands share the
same basic set of behaviors with subtle differences.)  For example,
./dequeue.template-spec.js generates test cases for commands that take
the "now playing" level out of the queue, such as !next and !random.
Each command that exhibits the set of behaviors imports the template spec
(using require) and executes the imported function, passing a callback
that triggers the command so the resulting behavior can be examined.

A couple additional notes:

- Test case closures for ShenaniBot pretty much always need to be
  declared async so they can call the bot's command() method.  They
  should also use function() syntax (rather than () =>) so that they can
  access the jasmine context object (passed as "this").

- Tests that need to peek at the queue should use the overlay/levels
  websocket interface rather than directly inspecting tht bot's internal
  data structures.  This reduces the risk that the test would break if
  the bot implementation chagnes.  ./helpers/wsHepler.js sets up several
  useful functions to support this.  However, only tests that set the
  httpPort option can use this approach.  Currently it is assumed that
  this value will be 8080.

- While the http server module is told to clear its state between tests,
  actually shutting down the server and starting a new one would be both
  messy and time-consuming.  For this reason, all tests need to agree on
  the http port value even if it is changed from the currently-assumed
  8080.
