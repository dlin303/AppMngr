AppMngr
=======

A web application to help a group of people or committee review submitted applications. No more cluttering up your inboxes with 
resumes, other people's comments, and other general application related junk.  

This is the first version of the application I wrote so it's still a bit rough. I plan on coming back to it to rework 
the UI and layout. For this initial version, I borrowed the layout and modified the basic structure (among some other 
things) from Alex Young of daily.js's nodepad, a note taking application build ontop of node.js. 


How It Works
============
Getting Started:

Make sure to have node.js and mongodb installed properly on whatever system the server is being run on. Start-up an 
instance of mongo. Then run app.js making sure that the port number in app.js is the correct port mongo is listening on.
And voila! Nagivate to '<somehost>/users/new' to get started!

Using AppMngr:

Once an application has been submitted at /documents/docs/new, it will appear within the AppMngr web app.
Once you've logged into AppMngr, you'll see the browser divided into three separate partitions. The left partition is
the list and links to the different applications that have been submitted, along with the folders you can filter them 
into: Accepted, Denied, Maybe.

The middle partition is where the application itself is displayed. Simply click on the application you want to view in
the left hand partition, and the contents of the application will appear in the middle partition. To filter the application
into the different 'folders,' simply click the 'Accept', 'Reject', or 'Maybe' button in the bottom left corner.

The right hand partition is where group comments are enabled. If you'd like to comment on an application, type the comment
into the text box and hit 'submit.' Your comments as well as those of whoever else is reviewing the application will be saved alongside
the application. Comments for the application being viewed are displayed in the right hand partition of the screen.


Disclaimer
==========

As stated above, this is a first version so it's pretty rough. It was originally written for a single use group only, so
this version only supports a single account (meaning only one group of people can create an account).

Plan for future versions include:
  - opening access to support private accounts for anyone group who wants one.
  - changing layout and format to support resume uploads and images
  - making it better. 

Please share any comments/critiques/suggestions! 
