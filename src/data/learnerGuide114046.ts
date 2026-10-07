export type LearnerGuidePage = { title: string; text: string };

export const LEARNER_GUIDE_CONTENT_PAGES: LearnerGuidePage[] = [
  {
    title: `SPECIFIC OUTCOME 1.`,
    text: `SPECIFIC OUTCOME 1.
Set up user access to a local area computer network.
Learning Outcomes
• 1. The explanation identifies resources whose access can be managed.
• 2. The explanation outlines the level of access for different categories of people.
• 3. The explanation outlines methods of controlling access.
• 4. The explanation outlines the purpose of an access audit trail.

1.1 Set up user access to a local area computer network.
PHYSICAL COMPONENTS
A local area network generally requires three principal components  besides the computers
being connected: network cards, cable or wire, and software. While software -driven, the
physical properties of a LAN include interfaces, called network access units, which connect
computers to networks. These units are actually netwo rk cards installed on computer
motherboards. Their job is to provide a connection, monitor availability of access, set or buffer
the data transmission speed, ensure against transmission errors and collisions, and assemble
data from the LAN into usable form  for the PC. A LAN consisting of two to four computers,
however, can be created without a network card and this kind of network is called a slotless
system. In a slotless system, the computers' serial and parallel ports are connected to each
other. Such LANs are very inexpensive and businesses use them largely for sharing hard -drive
space and printers, but they cannot support high-speed data transmission.
The next part of a LAN is the wiring, which provides the physical connection from one PC to
another, an d to servers and printers and other peripherals. The properties of the wiring
determine transmission speeds.
The first LANs were connected with coaxial cable, a variety of the type used to deliver cable
television. Certain kinds of coaxial cable are relatively inexpensive and coaxial cable is simple
to attach. More importantly, these cables provide great bandwidth (the system's rate of data
transfer), enabling transmission speeds up to 20 megabits per second.`,
  },
  {
    title: `During the 1980s, however, AT&T introduced a LAN  wiring system using ordinary twisted wir`,
    text: `During the 1980s, however, AT&T introduced a LAN  wiring system using ordinary twisted wire
pair of the type used for telephones. The primary advantages of twisted wire pair are that it is
very cheap, simpler to splice than coaxial, and is already installed in many buildings as
obsolete or redundant wiri ng. In fact, many buildings were left with stranded 25 -pair wiring
once used for key telephone systems.
But the downside of this simplicity is that its bandwidth is more limited, meaning that twisted
pair, designed for voice communication, transmits data at a slow rate. For example, AT&T's first
LAN product, StarLAN, had a capacity of only one megabit per second. Subsequent
improvements expanded this capacity tenfold and eliminated the need for shielded, or
conditioned, wiring.
A more recent development in LAN wiring is fiber distributed data interface (FDDI) or fiber -
optic cable. This type of wiring uses thin strands of glass to transmit pulses of light between
terminals. Its advantages are that it provides tremendous bandwidth and thus allows very high
transmission speeds: data transmission at a rate of up to 100 megabits per second. And,
because it is optical rather than electronic, it is impervious to  electromagnetic interference.
Fiber optics also supports a network of up to 1,000 computers and can transmit signals up to 50
miles. Its main drawbacks, however, are that splicing is difficult and requires a high degree of
skill and that it costs far more than its counterparts.
The primary application of fiber is not between terminals, but between LAN buses (terminals)
located on different floors. As a result, FDDI is used mainly in building risers. Within individual
floors, LAN facilities remain coaxial or twisted wire pair.
Where a physical connection cannot be made, such as across a street or between buildi ngs
where easements for wiring cannot be secured, microwave radio may be used. It is often
difficult, however, to secure frequencies for this medium.
Another alternative in this application is light transceivers, which project a beam of light similar
to fiber-optic cable, but through the air, rather than over cable. These systems do not have
the frequency allocation or radiation problems associated with microwave, but they are
susceptible to interference from fog and other obstructions.`,
  },
  {
    title: `The software needed for a LAN depends on the kind of network being created: whether`,
    text: `The software needed for a LAN depends on the kind of network being created: whether
slotless, peer-to-peer, or server-based. Slotless system software usually enables users to perform
the rudimentary tasks associated with slotless systems: sharing hard-drive space and printers. In
addition, this software may provide e -mail and security features. Basic slotless system utilities
are included in standard operating systems such as Windows 95 and Windows 98.
Peer-to-peer software facilitates peer -to-peer networks, which allow all us ers to access and
use the resources of all computers attached to the network, including hard drives and printers.
Peer-to-peer LANs, however, generally lack security and administration capabilities of server -
based LANs, as well as the capacity for large data transmissions. Nevertheless, they are less
expensive than their server-based counterparts.
Client/server software is designed for networks that designate a computer as the hub or server
of the LAN. The server computer is linked to all the other computers of the network—the client
computers—and it carries out the majority of the server duties, such as user access control and
coordinating user tasks. The server cannot be used as a workstation, however, without special
software allowing it to function as on e. The client computers use the programs and data
stored on the server. Server-based networks are best for companies with heavy network traffic.
TOPOLOGIES
LANs are designed in several different topologies or physical patterns of connecting terminals.
The most common topology is the bus, where several terminals are connected directly to
each other over a single transmission path. Its layout is linear and it resembles a street with
several driveways. The bus network requires cables that allow signals to flow in either direction,
called a full duplex medium. Each terminal on the bus LAN contends with other terminals for
access to the system. When it has secured access to the system, it broadcasts its message to
all the terminals at once. The message is picked up by the one terminal or group of terminal
stations for which it is intended. The bus network's lack of routing and central control make it
very reliable, because failure of one of the network's computers generally will not impede the
flow of other network traffic.`,
  },
  {
    title: `A second topology, the star network, also works like a bus in terms of contention and`,
    text: `A second topology, the star network, also works like a bus in terms of contention and
broadcast. But in the star, stations are connected to a single, central node that administers
access. The central node knows the path to all the other nodes, which makes routing easy.
The central node also enables access control and establishing a priority status for users.
Several of these nodes may be connected to one another. For example, a bus serving 6
stations may be connected to another bus serving 10 st ations and a third bus connecting 12
stations. The star topology is most often used where the connecting facilities are coaxial or
twisted wire pair.
The ring topology connects each station to its own node, and these nodes are connected in a
circular fashion. Node I is connected to node 2, which is connected to node 3, and so on, and
the final node is connected back to node 1. Messages sent over the LAN are regenerated by
each node, but retained only by the addressees. Eventually, the message circulates bac k to
the sending node, which removes it from the stream. Consequently, this configuration does
not require routing.

1.2 The explanation outlines methods of controlling access.
Network access control (NAC), also called network admission control, is a meth od of
bolstering the security of a proprietary network by restricting the availability of network
resources to endpoint devices that comply with a defined security policy
Network access control (NAC), also called network admission control, is a method of
bolstering the security of a proprietary  network by restricting the availability of network
resources to endpoint devices that comply with a defined security policy.
A traditional network access server (NAS) is a  server that
performsauthentication and authorization functions for potential users by
verifying logon information. In addition to these functions, NAC restricts the data that each
particular user can access, as well as implementing anti -threat applications such
as firewalls, antivirus software and spyware-detection programs. NAC also regulates and
restricts the things individual subscribers can do once they are connected. Several major
networking and IT vendors have introduced NAC products.`,
  },
  {
    title: `NAC is ideal for corporations and ag encies where the user environment can be rigidly`,
    text: `NAC is ideal for corporations and ag encies where the user environment can be rigidly
controlled. However, some administrators have expressed doubt about the practicality of
NAC deployment in networks with large numbers of diverse users and devices, the nature of
which constantly change. An e xample is a network for a large university with multiple
departments, numerous access point s and thousands of users with various backgrounds and
objectives.
Controlling Network Access
Computers are often part of a configuration of computers. The configura tion is called
a network. A network allows connected computers to exchange information. Networked
computers can access data and other resources from other computers on the network.
Networking has created a powerful and sophisticated way of computing. Howev er,
networking also jeopardizes computer security.
For instance, within a network of computers, individual machines are open to allow the sharing
of information. Also, because many people have access to the network, unwanted access is
more likely, especial ly through user error. For example, a poor use of passwords can allow
unwanted access.
Network Security Mechanisms
Network security is usually based on limiting or blocking operations from remote systems. The
following figure describes the security restrictions that you can impose on remote operations.
Figure 2–1 Security Restrictions for Remote Operations`,
  },
  {
    title: `1.3 The explanation outlines the purpose of an access audit trail.`,
    text: `1.3 The explanation outlines the purpose of an access audit trail.
AUDIT TRAILS
Audit trails maintain a record of system activity both by system and application processes and
by user activity o f systems and applications.  In conjunction with appropriate tools and
procedures, audit trails can assist in detecting security violations, per formance problems, and
flaws in applications.  This bulletin focuses on audit trails a s a technical control and discusses
the benefits and objective s of audit trails, the types of audit trails, and some common
implementation issues.

An audit trail is a series of recor ds of computer events, about an operating system, an
application, or user activities.  A computer system may have several audit trails, each devoted
to a particular type of activity.  Auditing is a review and analysis of management, operational,
and technical controls.  The audi tor can ob tain valuable information about activity on a
computer system from the aud it trail.  Audit trails improve the auditability of the computer
system.`,
  },
  {
    title: `Audit trails may be used as either a support for regular system operations or a kind of in`,
    text: `Audit trails may be used as either a support for regular system operations or a kind of insurance
policy or as both  of these.  As insurance, audit trails are maintained but are not used  unless
needed, such as after a system outage.  As a support for operations, audit trails are used to
help system administrators ensure that the sy stem or resources hav e not been harmed by
hackers, insiders, or technical problems.

BENEFITS AND OBJECTIVES
Audit trails can provide a m eans to help accomplish several security-related objectives,
including individual accountability, reconstruction of events (actions tha t hap pen on a
computer system), intrusion detection, and problem analysis.

Individual Accountability
Audit trails are a technical mechanism that help managers maintain individual accountability.
By advising users that they are personally accountable for their  actions, which are tracked by
an audit trail thatlogs user activities, managers can hel p promote proper user behavior. Users
are less likely to attempt to circumve nt security policy if they know that their actions will be
recorded in an audit log.

For example, audit trails can be used in concert with a ccess controls to identify and provide
information about users suspected of improper modification of data (e.g., introducing err ors
into a database).  An audit trail may record "before" and "after" versi ons of records.
(Depending upon the size of the file and the capabilities of the audit logging tools, this may be
very resource -intensive.)  Compariso ns can then be made between the actual changes
made to records and wh at was expected.  This can help management determine if errors
were made by the user, by the system or application software, or by some other source.
Audit trails work in concert with logical access controls, which restrict use of system resources.
Granting users  access to particular resources usually means that they need that access to
accomplish their job. Authorized access, of course, can be misu sed, which is where audit trail
analysis is useful.`,
  },
  {
    title: `While users cannot be  prevented from using resources to which they have legitimate access`,
    text: `While users cannot be  prevented from using resources to which they have legitimate access
authorization, audit trail analysis is used to examine their actions.  For example,  consider a
personnel office in which users have access to those perso nnel records for which they are
responsible.  Audit trails can revea l tha t an individual is printing far more records than the
average user, which could indicate the selling of personal data.  Another example may be an
engineer who is using a computer for the design of a new product.  Audit trai l analysis could
reveal that  an outgoing modem was used extensively by the engineer the week before
quitting.  This could be used to investigate whether proprietary data fileswere sent to an
unauthorized party.

Reconstruction of Events
Audit trails can also be used to reconst ruct events after a problem has occurred.  Damage
can be more easily assessed by reviewing audit trails of system activity to pinpoint how, when,
and why normal operations ceased. Audit trail analysis can often distinguish between
operator-induced errors (during which the system may have perf ormed exactly as instructed)
or system-created errors (e.g., arising from a poorly tested piece of replacement code).  If, for
example, a system fails or the integrity of a file (either program or data) is  questioned, an
analysis of the audit trail can reconstruct the series of steps taken by the system, the users, and
the application.  Knowledge of  the conditions that existed at the time of, for example, a
system crash, c an be useful in avoiding future outages.  Additionally, if a technical probl em
occurs (e.g., the corruption of a data file) audit trails can aid in  the recovery process (e.g., by
using the record of changes made to reconstruct the file).

Intrusion Detection
Intrusion detection refers to the process of identifying attempts to penetrate a system and gain
unauthorized access.  If audit trails hav e been designed and implemented to record
appropriate information, they can assist in intrusion detection.  Although nor mally thought of
as a real -time effort, intrusions can be detected in real t ime, by examining audit records as
they are created (or through th e use of other kinds of warning flags/notices), or after the fact
(e.g., by examining audit records in a batch process).`,
  },
  {
    title: `Real-time intrusion de tection is primarily aimed at outsiders attempting togain unauthori`,
    text: `Real-time intrusion de tection is primarily aimed at outsiders attempting togain unauthorized
access to the system.  It may al so be used to detect changes in the system's performance
indicative of, for example, a virus or worm attack (forms of malicious code) .  There may be
difficulties in implementing real-time auditing, including unacceptable system performance.

After-the-fact identification may indica te that unauthorized access was attempted (or was
successful).  Attent ion can then be given to damage assessment or reviewing c ontrols that
were attacked.

Problem Analysis
Audit trails may also be used as on -line tools to help identify problems other than intrusions as
they occur .  This is often referred to as real-time auditing or monitoring.  If a sys tem or
application is deemed to be critical to an organization's business  or mission, real-time auditing
may be implemented to monitor the status of these processes (although, as noted above,
there can be difficulties with real -time analysis).  An analysis of the audit trails may be able to
verify that the system operated normally (i.e., that an error may have resulted from operato r
error, as opposed to a system-originated error).  Such use of audi t trails may be
complemented by system performance logs.  For example, a significant increase in the use of
system resources (e.g., disk file spa ce or outgoing modem use) could indicate a security
problem.

AUDIT TRAILS AND LOGS
A system can maintain several different au dit trails concurrently.  There are typically two kinds
of audit records, (1 ) an event -oriented log and (2) a record of every keystroke, often called
keystroke monitoring.Event -based logs usually contain records describing system
events,application events, or user events.  An audit trail should include sufficient information to
establish what events occurred and who (or what) caused them.  In general, an event record
should specify when the event occurred, the user ID associated with the event, the program
or command used to init iate the event, and the result. Date and time can help determine if
the user was a masquerader or the actual person specified.`,
  },
  {
    title: `Keystroke Monitoring`,
    text: `Keystroke Monitoring
Keystroke monitoring is the process used to view or record both the keystrokes entered by a
computer user and th e computer's response during an interactive session.  Keystroke
monitoring is usually considered a special case of audit trails.  Examples of key stroke
monitoring would include viewing characters as they are typed by u sers, reading users'
electronic mail, and viewing other recorded information typed by users.

Some forms of routine system maintenance ma y record user keystrokes.  This could constitute
keystroke monitoring if the  keystrokes are preserved along with the user identification so that
an ad ministrator could determine the keystrokes entered by specific users.  Keyst roke
monitoring is conducted in an effort to protect systems and data from i ntruders who access
the systems without authority or in excess of their assigned authority.  Monitoring keystrokes
typed by intruders can help administrators assess and repair damage caused by intruders.

Audit Events
System audit records are generally used to monitor and fine -tune system performance.
Application audit trails may be used to discern flaws in applications, or violations of security
policy committed within an application.  User audits records are generally used to hold
individualsaccountable for their actions.  An analysis of user audit records mayexpose a
variety of security violations, which m ight range from simplebrowsing to attempts to plant
Trojan horses or gain unauthorized privileges.

The system itself enforces certain aspects of policy (particularly system -specific policy) such as
access to  files and access to the system itself.  Monitor ing the alteration of systems
configuration files that implement the policy is important.  If s pecial accesses (e.g., security
administrator access) have to be used to  alter configuration files, the system should generate
audit records whenever these accesses are used.

Sometimes a finer level of detail than s ystem audit trails is required. Application audit trails can
provide this greater level of recorded detail. If an application is critical, it can be desirable to
record not only who invoked the applica tion, but certain details specific to e ach use.  For
example, consider an e-mail application.`,
  },
  {
    title: `It may be desirable to record who sent mail, as well as to whom they sent m ail and the le`,
    text: `It may be desirable to record who sent mail, as well as to whom they sent m ail and the length
of messages. Another example would be that of a database  application.  It may be useful to
record who accessed what database as well as the individual rows or columns of a table that
were read (or chang ed or deleted), instead of just recording the execution of the database
program.

A user audit trail monitors and logs user activity in a system or application by recording events
initiated by the user (e.g., access of a file, re cord or field, use of a modem). Flexibility is a
critical feature of  audit trails.  Ideally (from a security point of view), a s ystem administrator
would have the ability to monitor all system and user activity, but c ould choose to log only
certain functions at the system level, and wi thin certain applications.  The decision of how
much to log and how much to review should be a function of application/data sensitivity and
should be decide d by each functional manager/application owner with guidance from the
system administrator andthe computer security manager/officer, weighing the costs and
benefits ofthe logging.  Audit logging can have privacy implications; users should be aware of
applicable privacy laws, regulations, and policies that may apply in such situations.

System-Level Audit Trails
If a system -level audit capability exists, the audit trail should capture, at a minimum, a ny
attempt to log on (s uccessful or unsuccessful), the log -on ID, date and time of each log -on
attempt, date and time of each log -off, the devices used, and the funct ion(s) performed
once logged on (e.g., the applications that the user tried, successfully or unsuccessfully, to
invoke).  System-level logging also typically includes information that is not specifically security-
related, such as system operations, cost-accounting charges, and network performance.

Application-Level Audit Trails
System-level audit trails may not be able to track and log events withi n applications, or may
not be able to provid e the level of detail needed by application or data owners, the system
administrator, or the computer security manager.  In general, application -level audit  trails
monitor and log user activities, including data files opened and closed, specific actions, such
as reading, editing, and deleting records or fields, and printing reports.`,
  },
  {
    title: `Some applications may be sensitive enough from a data availability, confide ntiality, and/`,
    text: `Some applications may be sensitive enough from a data availability, confide ntiality, and/or
integrity perspective that a "before" an d "after" picture of each modified record (or the d ata
element(s) changed within a record) should be captured by the audit trail.

User Audit Trails
User audit trails can usually log:

     -    all commands directly initiated by the user;
     -    all identification and authentication attempts; and
     -    files and resources accessed.

It is most useful if options and pa rameters are also recorded from commands.  It is much more
useful to know that a user tried to delete a log file (e.g., to hide unauthorized action s) than to
know the user merely issued the delete command, possibly for a personal data file.

IMPLEMENTATION ISSUES
Audit trail data requires protection, sin ce the data should be av ailable for use when needed
and is not useful if it is not accurate.  Also, the best planned and implemented audit trail is of
limited value without timely review of the logged data.  Audit trails m ay be reviewed
periodically, as needed (often triggered by  occurrence of a security event), automatically in
real-time, or in some combination  of these.  System managers and administrators, with
guidance from comp uter security personnel, should determine how long audit trail data will
be maintained -- either on the system or in archive files.

Following are examples of implementa tion issues that may have to be addressed when using
audit trails.

Protecting Audit Trail Data
Access to on -line audit logs should be  strictly controlled.  Computer security managers and
system administrators or managers should have accessfor review purposes; however, security
and/or administration personnel whomaintain logical access functions may have no need for
access to audit logs.`,
  },
  {
    title: `It is particularly important to ensure th e integrity of audit trail data against modifica`,
    text: `It is particularly important to ensure th e integrity of audit trail data against modification.  One
way to do this is to use digital signatures. Another way is to use write -once devices.  The audit
trail files need to be protected since, for example, intruders may  try to "cover their tracks" by
modifying audit trail records.  Audit trail records should be protected by strong access controls
to help prevent unau thorized access.  The integrity of audit trail information may be
particularly important when legal issues arise, such as when audit trails  are used  as legal
evidence.  (This may, for example, require daily printing and sig ning of the logs.) Questions of
such legal issues should be directed to the cognizant legal counsel.

The confidentiality of audit trail informa tion may also be protected , for example, if the audit
trail is recording information about  users that may be disclosure -sensitive such as trans action
data containing personal information (e.g., "before" and "after" re cords of modification to
income tax data).  Strong access control s and  encryption can be particularly effective in
preserving confidentiality.

Review of Audit Trails
Audit trails can be used to review wh at occurred after an event, for periodic reviews, and for
real-time analysis.  Reviewers should know what to look for to be effective in spotting unusual
activity.  They need to understand what normal activity looks like.  Audit trail review can be
easier if the audit trail function can be q ueried by user ID, terminal ID, application name, date
and time, or some other set of parameters to run reports of selected information.

Audit Trail Review After an Event.  Followin g a known system or application software problem,
a known violation of exis ting requirements by a user, or some unexplained system or user
problem, the appropriate system -level or application -level administrator should revi ew the
audit trails.  Review by the application/data owner would normally i nvolve a separate report,
based upon audit trail data, to determine if their resources are being misused.

Periodic Review of Audit Trail Data.  Application owners, data owner s, system administrators,
data processing function managers, and computer security managers should determine how
much review of audit trail records is necessary, based on the import ance of identifying
unauthorized activities.  This determination should hav e a direct correlation to the frequency
of periodic reviews of audit trail data.`,
  },
  {
    title: `Real-Time Audit Analysis.  Traditionally,  audit trails are analyzed in a batch mode at re`,
    text: `Real-Time Audit Analysis.  Traditionally,  audit trails are analyzed in a batch mode at regular
intervals (e.g., daily).  Audit records are archived during that interval for later analysis.  A udit
analysis tools can also be used in a real -time, or near real -time fas hion.  Such intrusion
detection tools are based on audit reduction,  attack signature, and  variance techniques.
Manual review of audit records in real -time is almost never feasible on large multiuser systems
due to t he volume of records generated.  However, it might be possible to vie w all records
associated with a particular user or applicati on, and vi ew them in real time.  (This is similar to
keystroke monitoring, though, and may be legally restricted.)

Tools for Audit Trail Analysis
Many types of tools have been developed to help to reduce the amount of information
contained in audit records, as well as to distill useful information from the raw data.  Especially
on larger systems, audit trailsoftware can create very large files, whic h can be extremely
difficult to analyze manually.  The use of automated tools is likely to be the difference between
unused audit trail data and a robust program.  Some of the types of tools include:

Audit reduction tools are preprocessors d esigned to reduce the volume of audit records to
facilitate manual review.  Before a security review, these tools can remove many audit records
known to have little security significance.  (This alone may cut in ha lf the number of records in
the audit trail.)  These tools generally remove records generated by specified classes of
events, such as records generated by nightly backups might be removed.

Trends/variance-detection tools look for anomalie s in user or system behavior.  It is possible to
construct mor e sophisticated processors that monitor usage trends and detect major
variations.  For example, if a us er typically logs in at 9 a.m., but appears at 4:30 a.m. one
morning, this may indicate a security problem th at may need to be investigated. Attack
signature-detection tools look for an attack signature, which is a specific sequence of events
indicative of an unauthorized access attempt. A simple example would be repeated failed
log-in attempts.`,
  },
  {
    title: `COST CONSIDERATIONS`,
    text: `COST CONSIDERATIONS
Audit trails involve many costs.  First, some system overhead is incurred recording the audit trail.
Additional s ystem overhead will be inc urred storing and processing the records.  The  more
detailed the records, the more overhead is required.  Another cost involves human and
machine time required to do the analysis.  This can  be minimized by using tools to perform
most of the analysis.  Many  simple analyzers can be constructed quickly (and cheaply) from
system utilities, but they a re limited to audit reduction and identifying particularly sensitive
events.  More complextools that identify trends or sequence s of events are slowly becoming
available as off -the-shelf software.  (If complex tools are not available for a system,
development may be prohibitively expensive.  Some intrusion detection systems, for example,
have taken years to develop.) The final cost of audit trails is the cost of inve stigating
anomalous events.  If the system is identifying  too many events as suspicious, administrators
may spend undue time reconstructing events and questioning personnel.

In groups outline the level of access for different categories of people.
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
______________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________________
___________________________________________________________________________________`,
  },
  {
    title: `SPECIFIC OUTCOME 2.`,
    text: `SPECIFIC OUTCOME 2.
Explain local area computer network performance issues.
Learning Outcomes
• 1. The explanation describes a range of factors that affects response times on a LAN.
• 2. The explanation outlines the need to analyse data and identify problems.
• 3. The explanation outlines how diagnostic tools are used to collect data.
• 4. The explanation outlines and compares methods for improving the performance with
respect to their effect on performance.

2.1 Explain local area computer network performance issues.
Local Area Networks (LANs) and Wide Area Networks (WANs) have much in common, but the
differences are enough to make them two separate acronyms in speech and in prac tice.
Each one has its benefits and downsides, and these advantages and disadvantages can
affect an organization’s productivity significantly. So what exactly is the difference between a
LAN connection and a WAN connection?
Local Area Networks (LANs)
Advantages Disadvantages
• Speed
• Cost
• Ease of Setup
• Limited to Small Area

LAN connections can only operate in a local area which is usually not any bigger then  a
house, or a floor in an office building. Typically a LAN will consist of only a handful of clients,
but can have upwards of a hundred.
One of the major advantages with LANs are the speeds they can reach. With a LAN, it isn’t
uncommon to see technology r eady for 1Gbps (1 gigabit per second).  Example: If you were
to download all 3 816 000 English articles off of Wikipedia it would take just over 13 hours to do
so, where as a WAN would take 16 days to do the same. A LAN can operate up to 30x faster
then a WAN`,
  },
  {
    title: `Another advantage to having a LAN connection is the cost. It is relatively cheap to have a`,
    text: `Another advantage to having a LAN connection is the cost. It is relatively cheap to have as it
tends to require less hassle to set up and less advanced infrastructure to keep it running. This is
mainly due to the technological components of a LAN, which brings me to the next
difference.
A LAN connection tends to require some relatively simple things to set it up. All you need is
some Ethernet cables, a network switch, and you are good to go. Alternatively, you can also
see LANs being done over Wi -Fi, or you can use Wi -Fi in conjunction with standard Ethernet
connections to create a LAN available to all kinds of devices, whether it be a smartphone or a
desktop computer.
The major disadvantage with a LAN is inherent in its name. “Local” Area Networks are on ly
good as far as you can reach an Ethernet cable or Wi-Fi signal. Simply put, you cannot buy an
Ethernet cable that will reach throughout an entire building, and a Wi -Fi connection rapidly
deteiorates as you get further then a few dozen meters away.

DIFFICULTIES
LANs are susceptible to many kinds of transmission errors. Electromagnetic interference from
motors, power lines, and sources of static, as well as shorts from corrosion, can corrupt data. In
addition, different kinds of cables are more suscepti ble to these problems than others.
Software bugs and hardware failures can also introduce errors, as can irregularities in wiring
and connections.
LANs generally compensate for these errors by working off an uninterruptible power source,
such as batteries, and using backup software to recall most recent activity and hold unsaved
material. Some systems may be designed for redundancy, such as keeping two file servers and
alternate wiring to route around failures.
In addition, as computer software evolves requ iring faster processors and faster rates of
transmission, LAN technology also must evolve. Multimedia and video applications in
particular force companies to upgrade their LANs in order to use such applications in a
network environment. Consequently, LANs increasingly need to transmit data at gigabit, not
megabit, speeds and hence older technology must be upgraded or replaced.`,
  },
  {
    title: `PURCHASING A LAN`,
    text: `PURCHASING A LAN
When purchasing a LAN, or even investigating the possibility of installing one, several
considerations must be kept in mind. The  costs involved and the administrative support
needed often far exceed reasonable predictions.
Three general concerns when considering a LAN include administration, security, and
productivity. Administration utilities regulate and coordinate file, application, peripheral, and
resource use, while security utilities control access to the network. Productivity refers to the
tasks a company wants to perform via a LAN, which may include file, database, and printer
sharing.

Moreover, thorough consideration of potential costs should include such factors as purchase
price of equipment, spare parts and  taxes, installation costs, labor and building modifications,
and permits. Operating costs include forecasted public network traffic, diagnostics, and
routine maintenance. In addition, the buyer should seek a schedule of potential costs
associated with upgrades and expansion of the network, since company LANs tend to require
new technology and to expand periodically.
The vendor should agree to a  contract expressly detailing the degree of support that will be
provided in installing and turning on the system. In addition, the vendor should p rovide a
maintenance contract that binds the company to make immediate, free repairs when
performance of the system exceeds prescribed standards. All of these factors should be
addressed in the buyer's request for proposal, which is distributed to potential vendors.`,
  },
  {
    title: `SPECIFIC OUTCOME 3.`,
    text: `SPECIFIC OUTCOME 3.
Explain local area computer network support issues.
Learning Outcomes
• 1. The explanation distinguishes sources.
• 2. The explanation outlines user expectations of a range of support options.

3.1 Explain local area computer network support issues

TRANSMISSION METHODS USED BYLANS

LANs are effective because their transmission capacity is greater than any single terminal on
the system. As a result, each station terminal can be offered a certain amount of time on the
LAN, like a time -sharing arrangement. To take advantage of this wind ow of opportunity,
stations organize their messages into compact packets that can be quickly disseminated.In
contending for access, a station with something to send stores its data packet in a buffer until
the LAN is clear. At that point the message is sent out. Sometimes, two stations may detect the
opening at the same time and send their messages simultaneously. Unaware that another
message has been sent out, the two signals will collide on the LAN. When this happens it is up
to the software to determine who should go first and ask both machines to try again.In busy
LANs, collisions would occur all the time, slowing the system down considerably. To solve the
problem, the LAN software circulates a token. This works like a ticket that is distributed only to
one station at a time. Instead of waiting for the LAN to clear, the station waits to receive the
token.When it has the token, the station sends its packet out over the LAN. When it is done, it
returns the token to the stream for the next user. Tokens, used  in ring and bus topologies,
virtually eliminate the problem of collisions by providing orderly, noncontention access.
The transmission methods used on LANs are either baseband or broadband. The baseband
medium uses a high-speed digital signal consisting of square wave DC voltage. While it is fast,
it can accommodate only one message at a time. As a result it is suitable for smaller networks
where contention is low. It also is very simple, requiring no tuning or frequency discretion
circuits. As a result, the transmission medium may be connected directly to the network access
unit and is suitable for use over twisted wire pair facilities.`,
  },
  {
    title: `In contrast, the broadband medium tunes signals to special frequencies, much like cable`,
    text: `In contrast, the broadband medium tunes signals to special frequencies, much like cable
television. Stations are instruc ted by signalling information to tune to a specific channel to
receive information. The information within each channel on a broadband medium may also
be digital, but they are separated from other messages by frequency. As a result, the medium
generally requires higher capacity cables, such as coaxial cable. Suited for busier LANs,
broadband systems require the use of tuning devices in the network access unit that can filter
out all but the single channel it needs.

SERVERS
File and printer servers provided the initial impetus for companies to develop LANs so that they
could share databases and expensive peripherals such as printers. Furthermore, the heart of
the LAN, the administrative software, generally resides either in a  dedicated file server (which
functions as a server only) or, in a smaller, less busy LAN, in a computer acting as a file server
(which also can function as a workstation). In addition to acting as a kind of traffic cop by
controlling and regulating user a ccess, this server holds files for shared use in its hard drives,
administers applications such as operating systems, and coordinates tasks such as
printing.Where a single computer is used both as a workstation and a file server, response
times may lag because its processors are forced to perform several instructions at once. In
addition, the system will store certain files on different computers connected with the LAN.
Consequently, if one machine is down, the entire system may be crippled. Moreover, if th e
system were to crash due to under capacity, some data may be lost or corrupted.

The addition of a dedicated file server may be costly, but it provides several advantages over
a distributed system. In addition to ensuring access even when some machines are down, it is
unencumbered by multiple duties. Its only jobs are to hold files and provide access.Since 1990
one of the most notable developments in LANs has been the growth of communication
servers that allow LANs to communicate with networks outside of the LANs themselves.
Communication servers enable remote LAN access, e- mail, fax, and other communication
services. Like other servers, this one controls access and facilitates use of communications
software and hardware. As with file and printer servers, a separate computer may be
designated as a dedicated server to enhance reliability.Furthermore, the LANs of the late`,
  },
  {
    title: `1990s began to include servers devoted other applications such as those for decision suppo`,
    text: `1990s began to include servers devoted other applications such as those for decision support,
transaction processing, and data warehousing.  The number of application servers is forecast
to increase significantly as more companies add dedicated application servers to their LANs.

SPEED MEASUREMENTS
The speed of the LAN is measured in terms of throughput, a figure different from transmission
speed because it takes into account the capacity of the wiring and the distance between
stations. The data rate, which most directly represents response time, is determined by
throughput and other factors such as overhead bits and other signals, error and co llision
recovery, software and hardware efficiency, and the memory capacity of disk drives.

OTHER EQUIPMENT
As mentioned earlier, LANs are generally limited in size because of the physical properties of
the network: distance, impedance (a kind of electrical resistance), and load. Some
equipment, such as repeaters, can extend the range of a LAN. Repeaters have no processing
ability, but simply regenerate signals that are weakened by impedance.Other types of LAN
equipment with processing ability include gate ways, which refer to the hardware and
software necessary to enable technologically different networks to communicate with each
other. A gateway, for example, can compensate for dissimilar protocols to pass information by
translating them into a simpler code, such as ASCII. A bridge works like a gateway, but instead
of connecting technologically different networks, it connects networks employing the same
kind of technology. Similar to a bridge, a router is the hardware and software connection
between two (or  more) networks or subnetworks that routes traffic from one network or
subnetwork to another. But routers primarily control the transmission of packets to their
destinations.
Gateways, bridges, and routers can act as repeaters, boosting signals over greater distances.
They also enable separate LANs located in different buildings to communicate with each
other.

In some cases, separate LANs located in different cities — and even separate countries — may
be linked over a public network. Whether these are "nailed up" dedicated links or switched
services, the connection of two or more such LANs in separate geographic locations is referred`,
  },
  {
    title: `to as a wide area network (WAN).WANs require the use of special software programs in the`,
    text: `to as a wide area network (WAN).WANs require the use of special software programs in the
operating system to enable dial -up connections that may be performed by a router. Unless
limited to modem speeds, these connections may require special services, such as integrated
services digital network ( ISDN), to ensure efficient transmission, particularly of large data files.
Increasingly, companies employing LANs in separate locations also operate WANs.

Another device, which can be used to create LANs, is the private branch exchange. Private
branch exchanges (PBXs) are telephone switching systems that generally serve one company
or network and route data and information to specific servers, rather than broadcasting to all
stations. PBXs are oblivious to operating systems and use only twisted pair. As a result, PBX
networks are somewhat slower and their applications are more limited than oth er kinds of
LANs.`,
  },
  {
    title: `SPECIFIC OUTCOME 4.`,
    text: `SPECIFIC OUTCOME 4.
Explain typical viruses on local area computer networks.
Learning Outcomes
• 1. The explanation outlines the symptoms and transmission of viruses.
• 2. The explanation allows the selection of a method for the prevention, detection, and
eradication of viruses for a situation.

4.1 Explain typical viruses on local area computer networks.

Types of Computer Viruses
What Is a Computer Virus
There are all  types of computer viruses  but what is a computer virus? A computer virus has
been defined as a set of computer instructions that reproduces itself and it may attach to
other executable code. Usually this code is a short program that may either embed in other
code or stand on it's own. In essence, this computer program is designed to infect some
aspect of the host computer and then copy itself as much and as often as it has the chance.
It was estimated that a virus by the name of mydoom infected well over a quarter a million
computers in one day back in 2004. There are tens of thousands of worms and viruses now
being spread via the internet with new ones being discovered each and every day. It is often
through quite innocuous and normal internet activities like the exchange of files like music,
photos and others that many people are infected with these unwanted and sometimes
dangerous programs.

The nomenclature that is now used to describe viruses has changed considerably over the last
few years as more, if not most, computers are no w on the internet. This has ushered in a
change in the  types of computer viruses  toward a worm/virus hybrid and has caused the
distinction between them to vanish. There are a whole group of people that spend a
tremendous amount of time looking for what hav e been termed backdoors into your
computer so they can find ways to inject their code into your computer and use it for their
own intentions.`,
  },
  {
    title: `What Does A Virus Do`,
    text: `What Does A Virus Do
The task of a virus is not always destructive like deleting files that may be important or
something like causing your hard drive to crash. Many viruses these days are more interested in
harvesting information from your computer and or using it as a zombie for their intentions like
spam or other illegal purposes. In times past it was often the int ention of a virus to do damage
just for the sake of destruction and maybe bragging rights among peers but almost all viruses
today that are widespread have at their root some economic agenda.

How Does A Virus Spread
One of the intents of all  types of computer viruses that gets installed on your computer will be
to spread itself. This happens in a fashion that is not all that different from what happens with a
virus in the human population. It is through exposure that the virus spreads when the
computers defenses are down or non existent. Also like their biological counterpart the
computer virus can be spread rapidly and ar e not very easy to get rid of. Because the way a
virus operates is to be stealthy, coupled with the rapid communications that happen between
today’s computers, it is easy to dramatically increase the speed at which a virus that is
targeting a newly discovered vulnerability can move around the web and around the world.

A virus that targets a network of computers can even more easily spr ead since so many
computers are connected and most likely will have the same vulnerability and easy access to
one another. Often viruses will spread via shared folders, email or over other media that is
often exposed to other computers via removable media like cds and flash drives.

Because there are so many types of computer viruses, a virus can infect another computer
unintentionally anytime that program is run and the virus is activated. Something like opening
a email attachment or downloading a file off  the internet or giving or receiving a copy of a
program or file from a co-workers thumb drive can expose you and others to a computer virus.
Literally the gamut of these types of computer viruses can expose you whenever you have a
downloaded file or a external drive attached to your pc. The most common way they spread
is via email attachments or with the use or transfer of files via instant messaging.`,
  },
  {
    title: `The Types of Computer Viruses`,
    text: `The Types of Computer Viruses

There are six broad categories or types of computer viruses:
1. Boot Sector Virus
2. File Infection Virus
3. Multipartite Virus
4. Network Virus
5. E-mail Virus
6. Macro Virus

File viruses: File-infecting viruses attack executable programs, such as all files with “.exe” and
“.com” extensions.
Script viruses: Script viruses  are a subset of file viruses, written in a variety of script languages
(VBS, JavaScript, BAT, PHP, etc.). They either infect other scripts ( for example, Windows or Linux
command and service files), or form a part of multi -component viruses. Script viruses are able
to infect other file formats, such as HTML, if the file format allows the execution of scripts.
Boot viruses : Boot viruses attack boot sectors (removable media boot sector or hard disk
master boot sector) and set their own loading routines at start-up
Macro viruses: Macro viruses attack documents where other commands (macros) can be
inserted. These viruses are often embedded within word processing or spreadsheet
applications, since macros are easily inserted into these types of files.
Viruses can  also be classified according to the way they perform their action. While  direct
action viruses perform an action immediately after the infected object is activated,  resident
viruses stay and work in the computer’s memory.

Malware
Malware is the term used the describe malicious programs and techniques that are not viruses
but still pose a threat to your system.
Worm: A worm is an independent program that copies itself across a network. Unlike a virus
(which needs the infected file to be copied in order to  replicate itself), the worm spreads
actively by sending copies of itself via LAN or Internet, email communication, or through
operating system security bugs.`,
  },
  {
    title: `They can also bring with them additional malware (such as installing  backdoor programs–se`,
    text: `They can also bring with them additional malware (such as installing  backdoor programs–see
below), though this behavior is not strictly limited to worms. Worms can cause a great deal of
damage–often they are used to “jam” communication channels by means of a DoS attack. A
worm is capable of spreading worldwide, via the Internet, in minutes.

Trojan: A  Trojan is a malware program that, unlike viruses or worms, cannot copy itself and
infect files. It is usually found in the form of an executable file (.exe, .com) and does not
contain anything aside from the Trojan code itself. For this reason, the only solution is to delete
it. Trojans have various functions, from keylogging (they log and transmit every keystroke), to
deleting files or disc formatting. Some contain a special feature that installs a backdoor
program, (a client -server application that grants the developer remote access to your
computer). Unlike common (legitimate) software with similar functions, it installs itself without
the consent of the client computer.

 Adware: Adware is short for advertising -supported software, which is software dedicated to
displaying advertisements. Adware works by displaying pop -up windows during Internet
browsing, by setting various websites as your homepage or by opening a spe cial program
interface window. Adware is often bundled with free -to-download programs, and the client is
usually informed of this in the End User License Agreement. Adware advertisements allow
freeware developers to earn revenue by offering program features available only with the
paid version. In most cases, installation of adwa re falls within legal guidelines –there are many
legitimate advertising -supported programs. However, issues such as the assertiveness of
advertisements as well as their content can make the legality of some adware questionable.

Spyware: Spyware is softwar e that uses the Internet for collecting various pieces of sensitive
information about the user without his/her awareness. Some Spyware programs search for
information such as currently installed applications and a history of visited websites. Other
Spyware programs are created with a far more dangerous aim: the collection of financial or
personal data for the purpose of Identity Theft.`,
  },
  {
    title: `Riskware: This type of malware includes all applications that increase the user’s security`,
    text: `Riskware: This type of malware includes all applications that increase the user’s security risk
when running. As with spyware and adware installation, riskware installation may be confirmed
by license agreement. “Dialers” are a common example of Riskware– programs that divert
connection to a preset paid number. Such programs can be legally used for Internet service
payments, but they are often misused and the diverting occurs without the user’s awareness.

Dangerous applications : A dangerous application is the term used for legal programs that,
though installed by the user, may subject him/her to security risks. Examples include
commercial keylogging or screen capture, remote access tools, password -cracking and
security testing programs.

Hoaxes: A hoax is deliberate misinformation sent by email and spread with the help of an
unsuspecting or uninformed public. Hoa xes are typically designed to get a user to do
something they should not do. Malicious hoaxes often advise users to delete valid operating
system files, claiming that the file is a dangerous virus.

In many cases, hoaxes refer to a credible institution/company in order to gain the reader’s
attention. For example, “Microsoft warns that…” or “CNN announced”. These messages often
warn of disastrous or even catastrophic consequences. The warnings have one thing in
common – they urge users to send the messages t o everyone they know, which perpetuates
the life-cycle of the hoax. 99.9% of these types of messages are hoaxes.

Hoaxes cannot spread by themselves, the only way to protect yourself is to verify the
authenticity of an email message's claims before taking any action.

Scams: Broadly defined, scams are deceptions perpetrated on computer users for the
purpose of financial gain or identify theft. One of the most common scams involves an
unsolicited fax, email, or letter from Nigeria or other West -African nation. The letter will appear
to be a legitimate business proposal, but will require an advanced fee from the target. The
proposal is of course fraudulent, and any fees paid by the target are immediately stolen.`,
  },
  {
    title: `Another common form of scamming includes phishing email messages and websites. The`,
    text: `Another common form of scamming includes phishing email messages and websites. The
purpose of these scams is to gain access to sensitive data such as bank account numbers, PIN
codes, etc. Access is usually achieved by sending email masquerading as a trustworthy
person or business (financial institution, insurance company).

The email (or website that the user is directed to) can look very genuine and will contain
graphics and content that may have originally come from the source that it is impersonating.
The user will be asked to enter personal data su ch as bank account numbers or usernames
and passwords. All such data, if submitted, can easily be stolen and misused.

Remote attacks
Special techniques which allow attackers to compromise remote systems. These are di vided
into several categories:
DoS atta cks: DoS, or Denial of Service, is an attempt to make a computer or network
unavailable for its intended users. DoS attacks obstruct communications between affected
users, preventing them from continuing in a functional way. One common method of attack
involves saturating the target machine with external communications requests, so that the
target machine cannot respond to legitimate traffic, or responds so slowly as to be rendered
effectively unavailable. Such attacks usually lead to a server overload. Computers exposed to
DoS attacks usually need to be restarted in order to work properly.The targets of DoS attacks
are web servers and the aim is to make them unavailable to users for a certain period of time.

DNS Poisoning: Using DNS (Domain Name Server) p oisoning, hackers can trick the DNS server
of any computer into believing that fake data is legitimate and authentic. The fake
information is cached for a certain period of time, allowing attackers to rewrite DNS replies of
IP addresses. As a result, users trying to access DNS poisoned websites will download computer
viruses or worms instead of the website's original content.

Port scanning : Port scanning is used to determine which computer ports are open on a
network host. A port scanner is software designed to find such ports.A computer port is a
virtual point which handles incoming and outgoing data – this is crucial from a security point of`,
  },
  {
    title: `view. In a large network, the information gathered by port scanners may help to identify`,
    text: `view. In a large network, the information gathered by port scanners may help to identify
potential vulnerabilities.  Such use is legitimate.Still, port scanning is often used by hackers
attempting to compromise security. Their first step is to send packets to each port. Depending
on the response type, it is possible to determine which ports are in use. The scanning itse lf
causes no damage, but be aware that this activity can reveal potential vulnerabilities and
allow attackers to take control of remote computers.Network administrators are advised to
block all unused ports and protect those that are in use from unauthoriz ed access.

TCP desynchronization: TCP desynchronization is a technique used in TCP Hijacking attacks. It is
triggered by a process in which the sequential number in incoming packets differs from the
expected sequential number. Packets with an unexpected sequential number are dismissed
(or saved in buffer storage if they are present in the current communication window).In
desynchronization, both communication endpoints dismiss received packets, at which point
remote attackers are able to infiltrate and supply packets with a correct sequential number.
The attackers can even manipulate or modify communication.TCP Hijacking attacks aim to
interrupt server-client and/or peer-to-peer communications. Many attacks can be avoided by
using authentication for each TC P segment. It is also advised to use the recommended
configurations for your network devices.

SMB Relay: SMBRelay and SMBRelay2 are special programs that are capable of carrying out
attacks against remote computers. The programs take advantage of the Serv er Message
Block file sharing protocol which is layered into NetBIOS. A user sharing any folder or directory
within the LAN most likely uses this file sharing protocol. Within local network communication,
password hashes are exchanged.

SMBRelay receives a connection on UDP port 139 and 445, relays the packets exchanged by
the client and server, and modifies them. After connecting and authenticating, the client is
disconnected. SMBRelay creates a new virtual IP address. The new address can be accessed
using the command “net use \\\\ 192.168.1.1“. The address can then be used by any of the
Windows networking functions. SMBRelay relays SMB protocol communication except for
negotiation and authentication. Remote attackers can use the IP address as long as the client
computer is connected.`,
  },
  {
    title: `SMBRelay2 works on the same principle as SMBRelay, except it uses NetBIOS names rather tha`,
    text: `SMBRelay2 works on the same principle as SMBRelay, except it uses NetBIOS names rather than
IP addresses. Both can carry out “man -in-the- middle” attacks. These attacks allow remote
attackers to read, insert and modify messages exchanged between two communication
endpoints without being noticed. Computers exposed to such attacks often stop responding
or restart unexpectedly. To avoid attacks we recommend that you use authentication
passwords or keys.

ICMP attacks: ICMP (Internet Control Message Protocol) is a popular and widely -used Internet
protocol. It is used primarily by networked computers to send various error messages.Remote
attackers attempt to exploit the weaknesses of ICMP protocol. ICMP protocol is desi gned for
one-way communication requiring no authentication. This enables remote attackers to trigger
DoS (Denial of Service) attacks, or attacks which give unauthorized individuals access to
incoming and outgoing packets.Typical examples of an ICMP attack are ping flood,
ICMP_ECHO flood and smurf attacks. Computers exposed to an ICMP attack will experience
significantly slower performance in applications that use the Internet and have problems
connecting to the Internet.

Probes
Probes or port scanners check for improperly secured servers or services that may be running
on computers on your LAN (especially the one that is directly connected to the Internet).
These checks are usually performed by programs that take a range of IP addresses selected
by the person running the program, and look for common services like Web, mail, FTP, Telnet,
pcAnywhere, or proxy servers.   If any of these (or other) services are found, the program tries
to see if it can login or otherwise gain access to that service.   If it can, it flags that IP address
and service to the person running the program and what happens after that depends on
what they have in mind for your system!Your best defence against probes is to not run any
servers or services that you don't understand, or are no t sure what they are used for.   You also
should properly secure any services that you do run.   Finally, if you are a relative "newbie"
and/or especially paranoid about intruders,  don't run the free Wingate 2.1d version, which is
easily misconfigured and can allow intruders into your LAN.`,
  },
];
